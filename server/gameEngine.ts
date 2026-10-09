import {
  BossMinion,
  BossState,
  Bullet,
  DynamicEventHazard,
  DynamicEventState,
  DynamicEventType,
  GameMap,
  KillEvent,
  KillStreakTier,
  MapObstacle,
  Player,
  PlayerInput,
  PlayerScoreSummary,
  PowerUp,
  PowerUpRarity,
  PowerUpType,
  RoomState,
  WeaponModifier,
  WeaponType,
} from '../src/types/game.ts';
import { MAPS } from '../src/data/maps.ts';
import { DYNAMIC_EVENTS, EVENT_TYPES } from '../src/data/events.ts';
import {
  checkModifierCompatibility,
  GAME_CONSTANTS,
  WEAPONS,
} from '../src/data/weapons.ts';
import { SpatialHashGrid } from './spatialHash.ts';

interface DamageRecord {
  attackerId: string;
  damage: number;
  time: number;
}

export class GameEngine {
  public room: RoomState;
  public map: GameMap;
  private tickTimer: NodeJS.Timeout | null = null;
  private lastTickTime: number = 0;
  private nextPowerupSpawn: number = 0;
  private playerInputs: Map<string, PlayerInput> = new Map();
  private lastProcessedInputSeq: Map<string, number> = new Map();
  private lastFireTimes: Map<string, number> = new Map();
  private burstQueues: Map<string, { remaining: number; nextShotTime: number; angle: number }> = new Map();
  private recentDamageDealt: Map<string, DamageRecord[]> = new Map(); // targetId -> DamageRecord[]
  private portalCooldowns: Map<string, number> = new Map(); // entityId -> readyTime
  private tickCount: number = 0;

  // Spatial Partitioning Grids
  private playerGrid = new SpatialHashGrid<Player>(128);

  // Dirty state tracking for instant 0ms delta synchronization
  private powerUpsDirty: boolean = true;
  private obstaclesDirty: boolean = true;

  // Dynamic Events System
  private nextEventTime: number = 0;
  private currentEventState: DynamicEventState | null = null;
  private eventPhaseEndTime: number = 0;
  private meteorHazards: DynamicEventHazard[] = [];
  private nextMeteorDropTime: number = 0;

  // Boss Raid state
  private nextBossAttackTime: number = 0;

  // Callbacks
  private onTickCallback: (tickData: {
    players: Record<string, Partial<Player>>;
    projectiles: Bullet[];
    powerUps?: PowerUp[];
    obstacles?: MapObstacle[];
    timeRemaining: number;
    serverTime: number;
    currentEvent?: DynamicEventState | null;
    bountyLeaderId?: string;
    bountyAmount?: number;
    delta?: boolean;
    boss?: BossState | null;
  }) => void;
  private onKillCallback: (kill: KillEvent) => void;
  private onGameOverCallback: (scores: PlayerScoreSummary[], winner: PlayerScoreSummary) => void;
  private onPerfectDashCallback?: (playerId: string, bonusScore: number) => void;
  private onBountyPlacedCallback?: (playerId: string, playerName: string, bounty: number) => void;
  private onBountyClaimedCallback?: (killerName: string, victimName: string, bounty: number) => void;
  private onEventAlertCallback?: (event: DynamicEventState) => void;

  constructor(
    room: RoomState,
    callbacks: {
      onTick: (data: {
        players: Record<string, Partial<Player>>;
        projectiles: Bullet[];
        powerUps?: PowerUp[];
        obstacles?: MapObstacle[];
        timeRemaining: number;
        serverTime: number;
        currentEvent?: DynamicEventState | null;
        bountyLeaderId?: string;
        bountyAmount?: number;
        delta?: boolean;
        boss?: BossState | null;
      }) => void;
      onKill: (kill: KillEvent) => void;
      onGameOver: (scores: PlayerScoreSummary[], winner: PlayerScoreSummary) => void;
      onPerfectDash?: (playerId: string, bonusScore: number) => void;
      onBountyPlaced?: (playerId: string, playerName: string, bounty: number) => void;
      onBountyClaimed?: (killerName: string, victimName: string, bounty: number) => void;
      onEventAlert?: (event: DynamicEventState) => void;
    }
  ) {
    this.room = room;
    this.map = MAPS[room.mapId] || (room.gameMode === 'boss_raid' ? MAPS['boss_arena'] : (MAPS['asteroid_field'] || MAPS['space_station']));
    this.onTickCallback = callbacks.onTick;
    this.onKillCallback = callbacks.onKill;
    this.onGameOverCallback = callbacks.onGameOver;
    this.onPerfectDashCallback = callbacks.onPerfectDash;
    this.onBountyPlacedCallback = callbacks.onBountyPlaced;
    this.onBountyClaimedCallback = callbacks.onBountyClaimed;
    this.onEventAlertCallback = callbacks.onEventAlert;

    // Deep clone obstacles from map template
    this.room.obstacles = JSON.parse(JSON.stringify(this.map.obstacles));
    this.room.projectiles = [];
    this.room.powerUps = [];
    this.room.matchTimeRemaining = this.room.gameMode === 'boss_raid' ? 360 : GAME_CONSTANTS.MATCH_DURATION_SECONDS;
    this.room.matchDuration = this.room.gameMode === 'boss_raid' ? 360 : GAME_CONSTANTS.MATCH_DURATION_SECONDS;
    this.room.currentEvent = null;
    this.room.bountyLeaderId = undefined;
    this.room.bountyAmount = undefined;
  }

  public setPlayerInput(playerId: string, input: PlayerInput) {
    this.playerInputs.set(playerId, input);
    if (input.seq !== undefined) {
      this.lastProcessedInputSeq.set(playerId, input.seq);
    }
  }

  public start() {
    this.room.status = 'playing';
    const now = Date.now();
    this.lastTickTime = now;
    this.nextPowerupSpawn = now + 3500;
    this.nextEventTime = now + 40000; // First dynamic event after 40s

    // Initialize all players at spawn points with Split Shield & Hull
    const spawnPoints = [...this.map.spawnPoints];
    let spawnIdx = 0;
    for (const pid of Object.keys(this.room.players)) {
      const p = this.room.players[pid];
      const sp = spawnPoints[spawnIdx % spawnPoints.length];
      p.x = sp.x;
      p.y = sp.y;
      p.vx = 0;
      p.vy = 0;
      p.health = GAME_CONSTANTS.MAX_HULL;
      p.maxHealth = GAME_CONSTANTS.MAX_HULL;
      p.shield = GAME_CONSTANTS.MAX_SHIELD;
      p.maxShield = GAME_CONSTANTS.MAX_SHIELD;
      p.isDead = false;
      p.invulnerableUntil = now + GAME_CONSTANTS.INVULNERABLE_TIME;
      p.weapon = 'plasma';
      p.activeModifiers = [];
      p.dashCooldown = 0;
      p.killStreak = 0;
      p.killStreakTier = 'none';
      p.bounty = 0;
      p.assists = 0;
      p.lastDamageTime = 0;
      spawnIdx++;
    }

    // Start 60 FPS authoritative server tick loop
    if (this.room.gameMode === 'boss_raid') {
      this.room.matchTimeRemaining = 360;
      this.room.matchDuration = 360;
      // Base stats: 38,000 HP and 9,000 Shield for solo pilot
      // Dynamic co-op difficulty scaling: +15,000 HP and +6,000 Shield per each additional player/bot
      const playerCount = Math.max(1, Object.keys(this.room.players).length);
      const bossHp = 38000 + (playerCount - 1) * 15000;
      const bossShield = 9000 + (playerCount - 1) * 6000;
      this.room.boss = {
        id: 'boss_omega',
        name: 'ТИТАН ПУСТОТЫ • ОМЕГА [BETA 0.7]',
        x: this.map.width / 2,
        y: this.map.height / 2,
        vx: 0,
        vy: 0,
        angle: 0,
        health: bossHp,
        maxHealth: bossHp,
        shield: bossShield,
        maxShield: bossShield,
        phase: 1,
        isEnraged: false,
        radius: 110,
        damageContribution: {},
        attackName: 'ПЛАЗМЕННЫЙ ЗАЛП',
        minions: [],
      };
      this.nextBossAttackTime = now + 2000;
    }

    this.tickTimer = setInterval(() => {
      this.tick();
    }, GAME_CONSTANTS.TICK_INTERVAL_MS);
  }

  public stop() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private tick() {
    const now = Date.now();
    const dt = Math.min(0.064, (now - this.lastTickTime) / 1000);
    this.lastTickTime = now;

    // 1. Update match time
    this.room.matchTimeRemaining = Math.max(0, this.room.matchTimeRemaining - dt);
    if (this.room.matchTimeRemaining <= 0) {
      this.endGame();
      return;
    }

    // 2. Spatial Partitioning indexing
    this.playerGrid.clear();
    for (const p of Object.values(this.room.players)) {
      if (!p.isDead) {
        this.playerGrid.insert(p, GAME_CONSTANTS.PLAYER_RADIUS);
      }
    }

    // 3. Process Dynamic Events
    this.updateDynamicEvents(now, dt);

    // 4. Process Bots AI
    this.updateBots(now, dt);

    // 4b. Process Boss in Boss Raid mode
    if (this.room.gameMode === 'boss_raid') {
      this.updateBoss(now, dt);
    }

    // 5. Process Players Movement, Shield Regeneration & Abilities
    this.updatePlayers(now, dt);

    // 6. Process Projectiles, Raycasts, Mines & Collisions
    this.updateProjectiles(now, dt);

    // 7. Process Map Mechanics (Gravity Singularity & Wormhole Portals)
    this.updateMapMechanics(now, dt);

    // 8. Process Power-ups
    this.updatePowerUps(now);

    // 9. Update Bounty Leaderboard
    this.updateBountyStatus();

    // 10. Broadcast tick to clients (30 Hz network snapshot rate with 60 Hz physics accuracy)
    this.tickCount++;
    const shouldBroadcast = (this.tickCount % 2 === 0);
    if (!shouldBroadcast) {
      return;
    }

    const isKeyframe = this.tickCount % 60 === 0 || this.tickCount <= 4; // Full snapshot every 2 seconds or on initial ticks

    const sendPowerUps = isKeyframe || this.powerUpsDirty;
    if (sendPowerUps) this.powerUpsDirty = false;

    const sendObstacles = isKeyframe || this.obstaclesDirty;
    if (sendObstacles) this.obstaclesDirty = false;

    const playerSummaries: Record<string, Partial<Player>> = {};
    for (const [id, p] of Object.entries(this.room.players)) {
      playerSummaries[id] = {
        id: p.id,
        name: p.name,
        color: p.color,
        weapon: p.weapon,
        isBot: p.isBot,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx * 10) / 10,
        vy: Math.round(p.vy * 10) / 10,
        angle: Math.round(p.angle * 100) / 100,
        health: Math.round(p.health),
        shield: Math.round(p.shield),
        score: p.score,
        kills: p.kills,
        isDashing: p.isDashing,
        dashCooldown: Math.max(0, Math.round(p.dashCooldown)),
        isDead: p.isDead,
        lastProcessedSeq: this.lastProcessedInputSeq.get(id) || 0,
        cosmetics: p.cosmetics,
        activeModifiers: p.activeModifiers,
        // Send extended metadata on keyframes or when actively modified
        ...(isKeyframe ? {
          maxHealth: p.maxHealth,
          maxShield: p.maxShield,
          deaths: p.deaths,
          assists: p.assists,
          killStreak: p.killStreak,
          killStreakTier: p.killStreakTier,
          bounty: p.bounty,
          invulnerableUntil: p.invulnerableUntil,
          respawnAt: p.respawnAt,
          ping: p.ping,
        } : {}),
        ...(p.quadDamageRemaining && p.quadDamageRemaining > 0 ? { quadDamageRemaining: p.quadDamageRemaining } : {}),
        ...(p.stealthRemaining && p.stealthRemaining > 0 ? { stealthRemaining: p.stealthRemaining } : {}),
        ...(p.homingRemaining && p.homingRemaining > 0 ? { homingRemaining: p.homingRemaining } : {}),
        ...(p.empRemaining && p.empRemaining > 0 ? { empRemaining: p.empRemaining } : {}),
        ...(p.freezeRemaining && p.freezeRemaining > 0 ? { freezeRemaining: p.freezeRemaining } : {}),
        ...(p.burnRemaining && p.burnRemaining > 0 ? { burnRemaining: p.burnRemaining } : {}),
        ...(p.isCharging ? { isCharging: true, chargeLevel: p.chargeLevel } : {}),
      };
    }

    // High-performance compact bullets payload: omit unused/false fields
    const compactProjectiles = this.room.projectiles.map((b) => {
      const pObj: any = {
        id: b.id,
        ownerId: b.ownerId,
        color: b.color,
        x: Math.round(b.x * 10) / 10,
        y: Math.round(b.y * 10) / 10,
        vx: Math.round(b.vx),
        vy: Math.round(b.vy),
        damage: Math.round(b.damage),
        radius: b.radius,
        weaponType: b.weaponType,
      };
      if (b.modifiers && b.modifiers.length > 0) pObj.modifiers = b.modifiers;
      if (b.piercing) pObj.piercing = true;
      if (b.homing) pObj.homing = true;
      if (b.isMine) pObj.isMine = true;
      if (b.isBeam) {
        pObj.isBeam = true;
        pObj.beamEndX = Math.round(b.beamEndX || 0);
        pObj.beamEndY = Math.round(b.beamEndY || 0);
      }
      return pObj;
    });

    this.onTickCallback({
      players: playerSummaries,
      projectiles: compactProjectiles,
      powerUps: sendPowerUps ? this.room.powerUps : undefined,
      obstacles: sendObstacles ? this.room.obstacles : undefined,
      timeRemaining: Math.ceil(this.room.matchTimeRemaining),
      serverTime: now,
      currentEvent: this.currentEventState,
      bountyLeaderId: this.room.bountyLeaderId,
      bountyAmount: this.room.bountyAmount,
      delta: !isKeyframe,
      boss: this.room.boss ? { ...this.room.boss, minions: this.room.boss.minions ? [...this.room.boss.minions] : [] } : undefined,
    });
  }

  // --- DYNAMIC EVENTS SYSTEM ---
  private updateDynamicEvents(now: number, dt: number) {
    if (!this.currentEventState) {
      if (now >= this.nextEventTime) {
        // Trigger a new random event
        const randType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        const def = DYNAMIC_EVENTS[randType];

        this.currentEventState = {
          type: randType,
          phase: 'warning',
          name: def.name,
          description: def.description,
          warningSecondsLeft: def.warningDuration,
          activeSecondsLeft: def.activeDuration,
          hazards: [],
        };
        this.eventPhaseEndTime = now + def.warningDuration * 1000;
        this.room.currentEvent = this.currentEventState;

        if (this.onEventAlertCallback) {
          this.onEventAlertCallback(this.currentEventState);
        }
      }
      return;
    }

    // Active event progression
    if (this.currentEventState.phase === 'warning') {
      const remaining = Math.max(0, Math.ceil((this.eventPhaseEndTime - now) / 1000));
      this.currentEventState.warningSecondsLeft = remaining;

      if (now >= this.eventPhaseEndTime) {
        // Transition to active
        const def = DYNAMIC_EVENTS[this.currentEventState.type];
        this.currentEventState.phase = 'active';
        this.currentEventState.warningSecondsLeft = 0;
        this.eventPhaseEndTime = now + def.activeDuration * 1000;

        if (this.currentEventState.type === 'METEOR_SHOWER') {
          this.spawnMeteorHazards();
          this.nextMeteorDropTime = now + 1200;
        }
      }
    } else if (this.currentEventState.phase === 'active') {
      const remaining = Math.max(0, Math.ceil((this.eventPhaseEndTime - now) / 1000));
      this.currentEventState.activeSecondsLeft = remaining;

      // Event-specific live mechanics
      if (this.currentEventState.type === 'METEOR_SHOWER') {
        if (now >= this.nextMeteorDropTime) {
          this.detonateMeteors(now);
          this.spawnMeteorHazards();
          this.nextMeteorDropTime = now + 1600;
        }
      } else if (this.currentEventState.type === 'GRAVITY_STORM') {
        // Gravitational turbulent pulse
        const waveAngle = (now / 1000) * 1.5;
        for (const p of Object.values(this.room.players)) {
          if (!p.isDead) {
            p.vx += Math.cos(waveAngle) * 180 * dt;
            p.vy += Math.sin(waveAngle) * 180 * dt;
          }
        }
      }

      if (now >= this.eventPhaseEndTime) {
        // End event
        this.currentEventState = null;
        this.room.currentEvent = null;
        this.meteorHazards = [];
        this.nextEventTime = now + (45000 + Math.random() * 30000); // Next event in 45-75s
      }
    }
  }

  private spawnMeteorHazards() {
    this.meteorHazards = [];
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.meteorHazards.push({
        x: 200 + Math.random() * (this.map.width - 400),
        y: 200 + Math.random() * (this.map.height - 400),
        radius: 95,
        progress: 0,
      });
    }
    if (this.currentEventState) {
      this.currentEventState.hazards = this.meteorHazards;
    }
  }

  private detonateMeteors(now: number) {
    for (const h of this.meteorHazards) {
      // Damage all ships caught in meteor impact
      for (const p of Object.values(this.room.players)) {
        if (p.isDead || now < p.invulnerableUntil) continue;
        const d = Math.hypot(p.x - h.x, p.y - h.y);
        if (d <= h.radius) {
          const falloff = 1 - d / h.radius;
          const dmg = Math.round(65 * falloff);
          this.applyDamageToPlayer(p, dmg, 'environment', 'plasma', now);
        }
      }
    }
  }

  // --- MAP MECHANICS (GRAVITY SINGULARITY & WORMHOLES) ---
  private updateMapMechanics(now: number, dt: number) {
    for (const obs of this.room.obstacles) {
      // 1. Gravity Well Physics
      if (obs.type === 'gravity_well' && obs.pullRadius && obs.pullForce) {
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;

        // Pull players
        for (const p of Object.values(this.room.players)) {
          if (p.isDead) continue;
          const dist = Math.hypot(cx - p.x, cy - p.y);
          if (dist < obs.pullRadius && dist > 15) {
            const pull = obs.pullForce * (1 - dist / obs.pullRadius);
            const dirX = (cx - p.x) / dist;
            const dirY = (cy - p.y) / dist;
            p.vx += dirX * pull * dt;
            p.vy += dirY * pull * dt;
          }
        }

        // Pull bullets
        for (const b of this.room.projectiles) {
          const dist = Math.hypot(cx - b.x, cy - b.y);
          if (dist < obs.pullRadius && dist > 20) {
            const pull = obs.pullForce * 0.85 * (1 - dist / obs.pullRadius);
            const dirX = (cx - b.x) / dist;
            const dirY = (cy - b.y) / dist;
            b.vx += dirX * pull * dt;
            b.vy += dirY * pull * dt;
          }
        }
      }

      // 2. Wormhole Teleportation
      if (obs.type === 'portal' && obs.targetPortalId) {
        const targetPortal = this.room.obstacles.find((o) => o.id === obs.targetPortalId);
        if (!targetPortal) continue;

        const srcX = obs.x + obs.width / 2;
        const srcY = obs.y + obs.height / 2;
        const dstX = targetPortal.x + targetPortal.width / 2;
        const dstY = targetPortal.y + targetPortal.height / 2;

        // Teleport Players
        for (const p of Object.values(this.room.players)) {
          if (p.isDead) continue;
          const cd = this.portalCooldowns.get(p.id) || 0;
          if (now < cd) continue;

          const dist = Math.hypot(srcX - p.x, srcY - p.y);
          if (dist < obs.width / 2 + GAME_CONSTANTS.PLAYER_RADIUS) {
            // Wormhole Jump!
            p.x = dstX;
            p.y = dstY;
            this.portalCooldowns.set(p.id, now + 1400); // 1.4s portal cooldown
          }
        }
      }
    }
  }

  // --- BOT AI ---
  private updateBots(now: number, dt: number) {
    const isBossRaid = this.room.gameMode === 'boss_raid' && this.room.boss && this.room.boss.health > 0;

    for (const p of Object.values(this.room.players)) {
      if (!p.isBot || p.isDead) continue;

      let nearestTarget: { x: number; y: number; id: string } | null = null;
      let nearestDist = Infinity;

      if (isBossRaid) {
        // In Boss Raid: bots are allies of human players! They NEVER target human players or fellow ally bots.
        // Priority order: 1) shield guards (to shatter boss invulnerability), 2) kamikazes (to protect squad), 3) drones, 4) the Boss!
        const boss = this.room.boss!;
        const minions = (boss.minions || []).filter((m) => m.health > 0);

        // Sort minions by tactical threat level
        const sortedMinions = [...minions].sort((a, b) => {
          const rank = (t: string) => (t === 'shield_guard' ? 3 : t === 'kamikaze' ? 2 : 1);
          return rank(b.type) - rank(a.type);
        });

        for (const m of sortedMinions) {
          const d = Math.hypot(m.x - p.x, m.y - p.y);
          if (d < nearestDist && d < 800) {
            nearestDist = d;
            nearestTarget = { x: m.x, y: m.y, id: m.id };
          }
        }

        // If no close minion threat, concentrate firepower on the Titan Boss
        if (!nearestTarget) {
          nearestDist = Math.hypot(boss.x - p.x, boss.y - p.y);
          nearestTarget = { x: boss.x, y: boss.y, id: boss.id };
        }
      } else {
        // Standard PvP FFA / TDM modes
        for (const other of Object.values(this.room.players)) {
          if (other.id === p.id || other.isDead || (other.stealthRemaining && other.stealthRemaining > 0)) continue;
          if (this.room.gameMode === 'tdm' && other.team === p.team) continue;
          const d = Math.hypot(other.x - p.x, other.y - p.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestTarget = other;
          }
        }
      }

      let moveX = 0;
      let moveY = 0;
      let aimAngle = p.angle;
      let shooting = false;
      let dashing = false;

      if (nearestTarget) {
        aimAngle = Math.atan2(nearestTarget.y - p.y, nearestTarget.x - p.x);

        // Optimal engagement distances per weapon
        const optimalDist = isBossRaid
          ? 380
          : (p.weapon === 'railgun' ? 700 : p.weapon === 'plasma_shotgun' ? 180 : 420);

        if (nearestDist > optimalDist + 60) {
          moveX = Math.cos(aimAngle);
          moveY = Math.sin(aimAngle);
        } else if (nearestDist < optimalDist - 60) {
          moveX = -Math.cos(aimAngle);
          moveY = -Math.sin(aimAngle);
        } else {
          // Strafe tangentially
          moveX = -Math.sin(aimAngle);
          moveY = Math.cos(aimAngle);
        }

        if (nearestDist < 900) {
          shooting = true;
        }

        // Defensive dash
        if (p.health < 45 && p.dashCooldown <= 0 && Math.random() < 0.08) {
          dashing = true;
        }
      } else {
        const cx = this.map.width / 2;
        const cy = this.map.height / 2;
        moveX = Math.sign(cx - p.x) * 0.4;
        moveY = Math.sign(cy - p.y) * 0.4;
      }

      this.playerInputs.set(p.id, {
        moveX,
        moveY,
        angle: aimAngle,
        shooting,
        dashing,
        clientTime: now,
      });
    }
  }

  // --- PLAYER MOVEMENT, REGENERATION & DASH ---
  private updatePlayers(now: number, dt: number) {
    const isSolarFlare = this.currentEventState?.type === 'SOLAR_FLARE' && this.currentEventState.phase === 'active';
    const isEnergyOverload = this.currentEventState?.type === 'ENERGY_OVERLOAD' && this.currentEventState.phase === 'active';

    for (const p of Object.values(this.room.players)) {
      if (p.isDead) {
        if (now >= p.respawnAt) {
          this.respawnPlayer(p, now);
        }
        continue;
      }

      // 1. Status effects decrement
      if (p.speedBoostRemaining > 0) {
        p.speedBoostRemaining -= dt;
        if (p.speedBoostRemaining <= 0) p.speedMultiplier = 1.0;
      }
      if (p.quadDamageRemaining && p.quadDamageRemaining > 0) {
        p.quadDamageRemaining -= dt;
        if (p.quadDamageRemaining <= 0) p.quadDamageRemaining = 0;
      }
      if (p.stealthRemaining && p.stealthRemaining > 0) {
        p.stealthRemaining -= dt;
        if (p.stealthRemaining <= 0) p.stealthRemaining = 0;
      }
      if (p.homingRemaining && p.homingRemaining > 0) {
        p.homingRemaining -= dt;
        if (p.homingRemaining <= 0) p.homingRemaining = 0;
      }
      if (p.empRemaining && p.empRemaining > 0) {
        p.empRemaining -= dt;
        if (p.empRemaining <= 0) p.empRemaining = 0;
      }
      if (p.freezeRemaining && p.freezeRemaining > 0) {
        p.freezeRemaining -= dt;
        if (p.freezeRemaining <= 0) p.freezeRemaining = 0;
      }
      if (p.burnRemaining && p.burnRemaining > 0) {
        p.burnRemaining -= dt;
        // Apply DOT tick
        this.applyDamageToPlayer(p, 12 * dt, 'burn', 'plasma', now, true);
        if (p.burnRemaining <= 0) p.burnRemaining = 0;
      }

      // 2. Dash cooldown decrement (slowed if EMP afflicted)
      if (p.dashCooldown > 0) {
        const cdRate = p.empRemaining && p.empRemaining > 0 ? 0.6 : 1.0;
        p.dashCooldown = Math.max(0, p.dashCooldown - dt * 1000 * cdRate);
      }

      // 3. Shield Regeneration (Regenerates after 4.5s without taking damage, halted by EMP or Solar Flare)
      if (
        !isSolarFlare &&
        (!p.empRemaining || p.empRemaining <= 0) &&
        p.shield < p.maxShield &&
        now - (p.lastDamageTime || 0) >= GAME_CONSTANTS.SHIELD_REGEN_DELAY
      ) {
        p.shield = Math.min(p.maxShield, p.shield + GAME_CONSTANTS.SHIELD_REGEN_RATE * dt);
      } else if (isSolarFlare) {
        // Solar flare drains active shields to 0 temporarily
        p.shield = 0;
      }

      // 4. Input processing & Movement
      const input = this.playerInputs.get(p.id);
      if (input) {
        p.angle = input.angle;

        // Dash Maneuver + Perfect Dash detection
        if (input.dashing && p.dashCooldown <= 0 && !p.isDashing) {
          p.isDashing = true;
          p.dashCooldown = GAME_CONSTANTS.DASH_COOLDOWN;

          // Check if user performed a PERFECT DASH (dodged an incoming enemy projectile)
          this.checkPerfectDash(p, now);

          const dashDirX = input.moveX !== 0 || input.moveY !== 0 ? input.moveX : Math.cos(p.angle);
          const dashDirY = input.moveX !== 0 || input.moveY !== 0 ? input.moveY : Math.sin(p.angle);
          const len = Math.hypot(dashDirX, dashDirY) || 1;
          p.vx = (dashDirX / len) * GAME_CONSTANTS.DASH_SPEED;
          p.vy = (dashDirY / len) * GAME_CONSTANTS.DASH_SPEED;

          setTimeout(() => {
            p.isDashing = false;
          }, GAME_CONSTANTS.DASH_DURATION);
        }

        // Standard thrust movement
        if (!p.isDashing) {
          const mag = Math.hypot(input.moveX, input.moveY);
          const normX = mag > 0 ? input.moveX / mag : 0;
          const normY = mag > 0 ? input.moveY / mag : 0;

          // Freeze status reduces speed by 35%
          const freezeFactor = p.freezeRemaining && p.freezeRemaining > 0 ? 0.65 : 1.0;
          // Solar flare boosts ship speed by +25%
          const flareFactor = isSolarFlare ? 1.25 : 1.0;

          const targetSpeed = GAME_CONSTANTS.BASE_SPEED * p.speedMultiplier * freezeFactor * flareFactor;
          p.vx = normX * targetSpeed;
          p.vy = normY * targetSpeed;
        }

        // Weapon firing & Charging
        if (p.weapon === 'charge_beam') {
          if (input.shooting || input.chargeBeam) {
            p.isCharging = true;
            p.chargeLevel = Math.min(1.0, (p.chargeLevel || 0) + dt * 1.3);
          } else if (p.isCharging && (p.chargeLevel || 0) > 0.15) {
            // Release charged beam
            this.fireChargeBeam(p, now, p.chargeLevel || 0.2);
            p.isCharging = false;
            p.chargeLevel = 0;
          } else {
            p.isCharging = false;
            p.chargeLevel = 0;
          }
        } else if (input.shooting) {
          this.tryFireWeapon(p, now, isEnergyOverload);
        }
      } else {
        // Friction
        p.vx *= 0.85;
        p.vy *= 0.85;
      }

      // Position integration with obstacle collisions
      let nextX = p.x + p.vx * dt;
      let nextY = p.y + p.vy * dt;

      // Arena boundary collision
      const r = GAME_CONSTANTS.PLAYER_RADIUS;
      nextX = Math.max(r, Math.min(this.map.width - r, nextX));
      nextY = Math.max(r, Math.min(this.map.height - r, nextY));

      // Obstacle collision resolution (AABB vs Circle)
      for (const obs of this.room.obstacles) {
        if (obs.type === 'portal' || obs.type === 'gravity_well') continue;
        if (obs.type === 'explosive_core' && (obs.health ?? 0) <= 0) continue;

        const closestX = Math.max(obs.x, Math.min(nextX, obs.x + obs.width));
        const closestY = Math.max(obs.y, Math.min(nextY, obs.y + obs.height));
        const distX = nextX - closestX;
        const distY = nextY - closestY;
        const distance = Math.hypot(distX, distY);

        if (distance < r) {
          if (distance > 0) {
            nextX = closestX + (distX / distance) * r;
            nextY = closestY + (distY / distance) * r;
          } else {
            nextX = p.x;
            nextY = p.y;
          }

          if (obs.type === 'bumper') {
            p.vx = -p.vx * 1.5;
            p.vy = -p.vy * 1.5;
          }
        }
      }

      p.x = nextX;
      p.y = nextY;
    }
  }

  // --- PERFECT DASH VALIDATION ---
  private checkPerfectDash(player: Player, now: number) {
    let triggered = false;
    for (const b of this.room.projectiles) {
      if (b.ownerId === player.id) continue;
      const d = Math.hypot(b.x - player.x, b.y - player.y);
      if (d <= GAME_CONSTANTS.PERFECT_DASH_RADIUS + b.radius) {
        triggered = true;
        break;
      }
    }

    if (triggered) {
      player.score += GAME_CONSTANTS.SCORE_PERFECT_DASH;
      player.speedMultiplier = 1.35;
      player.speedBoostRemaining = 1.5; // Quick evasion impulse
      if (this.onPerfectDashCallback) {
        this.onPerfectDashCallback(player.id, GAME_CONSTANTS.SCORE_PERFECT_DASH);
      }
    }
  }

  // --- WEAPON FIRING & CHARGING ---
  private tryFireWeapon(player: Player, now: number, isEnergyOverload: boolean = false) {
    const config = WEAPONS[player.weapon];
    const lastFire = this.lastFireTimes.get(player.id) || 0;

    let effectiveFireRate = config.fireRate;
    if (player.activeModifiers.includes('rapid_fire')) effectiveFireRate *= 0.65;
    if (player.activeModifiers.includes('overcharge')) effectiveFireRate *= 1.35;
    if (isEnergyOverload) effectiveFireRate *= 0.55;

    if (now - lastFire < effectiveFireRate) return;

    this.lastFireTimes.set(player.id, now);
    player.shotsFired++;

    if (config.isBurst) {
      // Initiate 3-shot rapid burst
      this.spawnSingleBullet(player, now, 0, 1);
      let burstCount = config.burstCount || 3;
      let shotNum = 1;
      const interval = setInterval(() => {
        if (shotNum < burstCount && !player.isDead) {
          this.spawnSingleBullet(player, Date.now(), 0, 1);
          shotNum++;
        } else {
          clearInterval(interval);
        }
      }, config.burstDelay || 80);
      return;
    }

    const count = config.count;
    for (let i = 0; i < count; i++) {
      this.spawnSingleBullet(player, now, i, count);
    }
  }

  private spawnSingleBullet(
    player: Player,
    now: number,
    index: number,
    totalCount: number,
    angleOffset: number = 0
  ) {
    const config = WEAPONS[player.weapon];
    const baseAngle = player.angle + angleOffset;
    let shotAngle = baseAngle;

    if (totalCount > 1) {
      const offset = (index - (totalCount - 1) / 2) * config.spread;
      shotAngle += offset;
    } else if (config.spread > 0) {
      shotAngle += (Math.random() - 0.5) * config.spread;
    }

    const spawnOffset = GAME_CONSTANTS.PLAYER_RADIUS + 12;
    const bx = player.x + Math.cos(shotAngle) * spawnOffset;
    const by = player.y + Math.sin(shotAngle) * spawnOffset;

    let speed = config.speed;
    let damage = config.damage;
    let radius = config.radius;
    let piercing = Boolean(config.piercing || player.activeModifiers.includes('piercing'));
    let hasHoming = Boolean((player.homingRemaining && player.homingRemaining > 0) || player.activeModifiers.includes('homing'));

    // RAILGUN NERF & DIMINISHING HOMING INTEGRATION
    let homingStrength = 1.0;
    if (player.weapon === 'railgun' && hasHoming) {
      homingStrength = 0.22; // 78% reduction in steering torque!
      speed *= 0.8; // 20% speed nerf when using homing on railgun
      damage *= 0.85; // 15% damage reduction
    }

    if (player.activeModifiers.includes('overcharge')) {
      damage *= 1.4;
      radius += 2;
    }
    if (player.activeModifiers.includes('rapid_fire')) {
      damage *= 0.85;
    }
    if (player.quadDamageRemaining && player.quadDamageRemaining > 0) {
      damage *= 2.2;
      radius += 3;
    }

    const bullet: Bullet = {
      id: `b_${player.id}_${now}_${index}_${Math.random().toString(36).substring(2, 5)}`,
      ownerId: player.id,
      ownerName: player.name,
      color: player.quadDamageRemaining && player.quadDamageRemaining > 0 ? '#c026d3' : config.color,
      x: bx,
      y: by,
      vx: Math.cos(shotAngle) * speed,
      vy: Math.sin(shotAngle) * speed,
      damage,
      radius,
      weaponType: config.type,
      modifiers: [...player.activeModifiers],
      piercing,
      homing: hasHoming,
      homingStrength,
      bouncesLeft: player.weapon === 'ricochet_cannon' || player.activeModifiers.includes('ricochet') ? 3 : 0,
      isMine: config.isMine,
      armed: false,
      explosionRadius: config.explosionRadius || (player.activeModifiers.includes('explosive') ? 75 : undefined),
      isBeam: config.isBeam,
      createdAt: now,
      expiresAt: now + (config.isMine ? 18000 : 2500),
    };

    this.room.projectiles.push(bullet);
  }

  private fireChargeBeam(player: Player, now: number, chargeLevel: number) {
    const config = WEAPONS['charge_beam'];
    const baseAngle = player.angle;
    const spawnOffset = GAME_CONSTANTS.PLAYER_RADIUS + 14;
    const bx = player.x + Math.cos(baseAngle) * spawnOffset;
    const by = player.y + Math.sin(baseAngle) * spawnOffset;

    const scaledDamage = Math.round(config.damage + chargeLevel * 55); // Up to 85 damage!
    const scaledRadius = Math.round(config.radius + chargeLevel * 8);

    const bullet: Bullet = {
      id: `b_charge_${player.id}_${now}`,
      ownerId: player.id,
      ownerName: player.name,
      color: '#38bdf8',
      x: bx,
      y: by,
      vx: Math.cos(baseAngle) * config.speed,
      vy: Math.sin(baseAngle) * config.speed,
      damage: scaledDamage,
      radius: scaledRadius,
      weaponType: 'charge_beam',
      modifiers: [...player.activeModifiers],
      piercing: true,
      homing: false,
      chargeLevel,
      createdAt: now,
      expiresAt: now + 2000,
    };

    this.room.projectiles.push(bullet);
  }

  // --- PROJECTILES & COLLISION RESOLUTION ---
  private updateProjectiles(now: number, dt: number) {
    const remainingBullets: Bullet[] = [];

    for (const b of this.room.projectiles) {
      if (now > b.expiresAt) continue;

      // 1. Mine Launcher logic: arming & proximity
      if (b.isMine) {
        if (!b.armed && now - b.createdAt > 800) {
          b.armed = true; // Armed after 0.8s
        }
        if (b.armed) {
          // Slow down mine to stop
          b.vx *= 0.88;
          b.vy *= 0.88;

          // Proximity trigger
          const nearbyShips = this.playerGrid.query(b.x, b.y, 65);
          let detonated = false;
          for (const p of nearbyShips) {
            if (p.id !== b.ownerId && !p.isDead && now >= p.invulnerableUntil) {
              this.detonateExplosion(b.x, b.y, b.explosionRadius || 100, b.damage, b.ownerId, b.weaponType, now);
              detonated = true;
              break;
            }
          }
          if (detonated) continue;
        }
      }

      // 2. Homing Guidance
      if (b.homing) {
        let closestDist = Infinity;
        let targetX = 0;
        let targetY = 0;

        for (const p of Object.values(this.room.players)) {
          if (p.id === b.ownerId || p.isDead || (p.stealthRemaining && p.stealthRemaining > 0)) continue;
          const d = Math.hypot(p.x - b.x, p.y - b.y);
          if (d < closestDist && d < 650) {
            closestDist = d;
            targetX = p.x;
            targetY = p.y;
          }
        }

        if (closestDist < Infinity) {
          const desiredAngle = Math.atan2(targetY - b.y, targetX - b.x);
          const currentAngle = Math.atan2(b.vy, b.vx);
          let angleDiff = desiredAngle - currentAngle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

          // Homing turn torque (clamped severely for Railgun via homingStrength)
          const baseTurnSpeed = 4.8 * (b.homingStrength || 1.0) * dt;
          const newAngle = currentAngle + Math.max(-baseTurnSpeed, Math.min(baseTurnSpeed, angleDiff));
          const speed = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        }
      }

      const nextX = b.x + b.vx * dt;
      const nextY = b.y + b.vy * dt;

      // Arena boundary collision
      if (nextX <= 0 || nextX >= this.map.width || nextY <= 0 || nextY >= this.map.height) {
        if (b.bouncesLeft && b.bouncesLeft > 0) {
          b.bouncesLeft--;
          if (nextX <= 0 || nextX >= this.map.width) b.vx = -b.vx;
          if (nextY <= 0 || nextY >= this.map.height) b.vy = -b.vy;
          remainingBullets.push(b);
          continue;
        }
        continue; // Out of bounds
      }

      // Obstacle collisions
      let hitObstacle = false;
      for (const obs of this.room.obstacles) {
        if (obs.type === 'portal' || obs.type === 'gravity_well') continue;
        if (obs.type === 'explosive_core' && (obs.health ?? 0) <= 0) continue;

        if (nextX >= obs.x && nextX <= obs.x + obs.width && nextY >= obs.y && nextY <= obs.y + obs.height) {
          hitObstacle = true;

          // Explosive core damage
          if (obs.type === 'explosive_core' && obs.health !== undefined && obs.health > 0) {
            obs.health -= b.damage;
            this.obstaclesDirty = true;
            if (obs.health <= 0) {
              this.detonateExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, 240, 75, b.ownerId, b.weaponType, now);
            }
          }

          // Ricochet bounce off obstacles
          if (b.bouncesLeft && b.bouncesLeft > 0) {
            b.bouncesLeft--;
            b.vx = -b.vx;
            b.vy = -b.vy;
            hitObstacle = false; // Bounced, not absorbed!
            break;
          }
          break;
        }
      }

      if (hitObstacle && !b.piercing) {
        // Trigger split on obstacle if equipped
        if (b.modifiers?.includes('split')) {
          this.spawnSplitFragments(b, now);
        }
        if (b.modifiers?.includes('gravity')) {
          this.triggerGravitonVortex(b.x, b.y, b.ownerId, now);
        }
        if (b.explosionRadius) {
          this.detonateExplosion(b.x, b.y, b.explosionRadius, b.damage, b.ownerId, b.weaponType, now);
        }
        continue;
      }

      // In boss_raid mode, check Boss collision for human player projectiles
      if (this.room.boss && this.room.boss.health > 0 && b.ownerId !== 'boss') {
        const bossDist = Math.hypot(nextX - this.room.boss.x, nextY - this.room.boss.y);
        if (bossDist <= this.room.boss.radius + b.radius) {
          this.applyDamageToBoss(b.damage, b.ownerId, now);
          if (b.modifiers?.includes('split')) {
            this.spawnSplitFragments(b, now);
          }
          if (b.explosionRadius) {
            this.detonateExplosion(this.room.boss.x, this.room.boss.y, b.explosionRadius, b.damage, b.ownerId, b.weaponType, now);
          }
          if (!b.piercing) {
            continue;
          }
        }

        // Also check collision against Boss mini-NPC minions
        let hitMinion = false;
        if (this.room.boss.minions) {
          for (const m of this.room.boss.minions) {
            if (m.health <= 0) continue;
            const mDist = Math.hypot(nextX - m.x, nextY - m.y);
            if (mDist <= m.radius + b.radius) {
              m.health -= b.damage;
              hitMinion = true;
              if (m.health <= 0) {
                this.detonateExplosion(m.x, m.y, 80, 25, b.ownerId, b.weaponType, now);
                const attacker = this.room.players[b.ownerId];
                if (attacker) {
                  attacker.score += 80;
                }
              }
              break;
            }
          }
        }
        if (hitMinion && !b.piercing) {
          continue;
        }
      }

      // Player collisions using Spatial Partitioning
      let hitPlayer = false;
      const candidatePlayers = this.playerGrid.query(nextX, nextY, b.radius + GAME_CONSTANTS.PLAYER_RADIUS);

      for (const p of candidatePlayers) {
        if (p.id === b.ownerId || p.isDead || now < p.invulnerableUntil) continue;

        // In boss_raid mode, human players do not harm fellow squadmates (co-op mode)
        if (this.room.gameMode === 'boss_raid' && b.ownerId !== 'boss') continue;

        // Check dash invulnerability window
        if (p.isDashing) continue;

        const dist = Math.hypot(nextX - p.x, nextY - p.y);
        if (dist <= GAME_CONSTANTS.PLAYER_RADIUS + b.radius) {
          hitPlayer = true;
          this.applyDamageToPlayer(p, b.damage, b.ownerId, b.weaponType, now, false, b.modifiers);

          // Apply special weapon / modifier status effects
          if (b.weaponType === 'emp_cannon' || b.modifiers?.includes('emp')) {
            p.empRemaining = 4.0; // 4s EMP affliction
          }
          if (b.modifiers?.includes('freeze')) {
            p.freezeRemaining = 2.5; // 2.5s slow
          }
          if (b.modifiers?.includes('burn')) {
            p.burnRemaining = 3.0; // 3s fire
          }
          if (b.modifiers?.includes('chain')) {
            this.chainLightning(p, b.ownerId, b.damage * 0.5, now);
          }
          if (b.modifiers?.includes('split')) {
            this.spawnSplitFragments(b, now);
          }
          if (b.modifiers?.includes('gravity')) {
            this.triggerGravitonVortex(p.x, p.y, b.ownerId, now);
          }
          if (b.explosionRadius) {
            this.detonateExplosion(p.x, p.y, b.explosionRadius, b.damage * 0.75, b.ownerId, b.weaponType, now);
          }

          if (!b.piercing) break;
        }
      }

      if (hitPlayer && !b.piercing) {
        continue;
      }

      b.x = nextX;
      b.y = nextY;
      remainingBullets.push(b);
    }

    this.room.projectiles = remainingBullets;
  }

  private spawnSplitFragments(parentBullet: Bullet, now: number) {
    const count = 3;
    const baseAngle = Math.atan2(parentBullet.vy, parentBullet.vx);
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - 1) * 0.45;
      this.room.projectiles.push({
        id: `frag_${parentBullet.id}_${i}`,
        ownerId: parentBullet.ownerId,
        ownerName: parentBullet.ownerName,
        color: parentBullet.color,
        x: parentBullet.x,
        y: parentBullet.y,
        vx: Math.cos(angle) * 650,
        vy: Math.sin(angle) * 650,
        damage: Math.round(parentBullet.damage * 0.4),
        radius: 4,
        weaponType: parentBullet.weaponType,
        piercing: false,
        homing: false,
        createdAt: now,
        expiresAt: now + 900,
      });
    }
  }

  private chainLightning(hitPlayer: Player, attackerId: string, chainDamage: number, now: number) {
    let nearestNext: Player | null = null;
    let minD = Infinity;

    for (const other of Object.values(this.room.players)) {
      if (other.id === hitPlayer.id || other.id === attackerId || other.isDead || now < other.invulnerableUntil) continue;
      const d = Math.hypot(other.x - hitPlayer.x, other.y - hitPlayer.y);
      if (d < minD && d < 280) {
        minD = d;
        nearestNext = other;
      }
    }

    if (nearestNext) {
      this.applyDamageToPlayer(nearestNext, chainDamage, attackerId, 'laser_beam', now);
    }
  }

  private triggerGravitonVortex(cx: number, cy: number, attackerId: string, now: number) {
    const pullRadius = 260;
    const pullImpulse = 420;
    for (const p of Object.values(this.room.players)) {
      if (p.id === attackerId || p.isDead || now < p.invulnerableUntil) continue;
      const dist = Math.hypot(cx - p.x, cy - p.y);
      if (dist < pullRadius && dist > 15) {
        const factor = 1 - dist / pullRadius;
        const dirX = (cx - p.x) / dist;
        const dirY = (cy - p.y) / dist;
        p.vx += dirX * pullImpulse * factor;
        p.vy += dirY * pullImpulse * factor;
      }
    }
  }

  private detonateExplosion(
    cx: number,
    cy: number,
    radius: number,
    baseDamage: number,
    attackerId: string,
    weapon: WeaponType,
    now: number
  ) {
    const nearby = this.playerGrid.query(cx, cy, radius);
    for (const p of nearby) {
      if (p.isDead || now < p.invulnerableUntil) continue;
      const dist = Math.hypot(p.x - cx, p.y - cy);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        const blastDamage = Math.round(baseDamage * falloff);
        if (blastDamage > 0) {
          this.applyDamageToPlayer(p, blastDamage, attackerId, weapon, now);
        }
      }
    }
  }

  // --- DAMAGE, HULL, SHIELD, ASSISTS & KILL STREAKS ---
  private applyDamageToPlayer(
    target: Player,
    damage: number,
    attackerId: string,
    weapon: WeaponType,
    now: number,
    isDot: boolean = false,
    modifiers?: WeaponModifier[]
  ) {
    target.lastDamageTime = now;

    const attacker = this.room.players[attackerId];
    if (attacker && attacker.id !== target.id) {
      attacker.damageDealt += damage;
      attacker.shotsHit++;

      // Record damage contribution for assists
      let records = this.recentDamageDealt.get(target.id);
      if (!records) {
        records = [];
        this.recentDamageDealt.set(target.id, records);
      }
      records.push({ attackerId, damage, time: now });
    }

    // Modifier specific damage calculations
    let shieldBonus = modifiers?.includes('shield_breaker') ? 2.0 : 1.0;
    let hullBypassPercent = modifiers?.includes('armor_piercer') ? 0.4 : 0.0;

    let hullDirectDmg = damage * hullBypassPercent;
    let mainDmg = damage * (1 - hullBypassPercent);

    // 1. Damage to Hull directly (Armor Piercer)
    if (hullDirectDmg > 0) {
      target.health = Math.max(0, target.health - hullDirectDmg);
    }

    // 2. Shield absorbs main damage
    if (target.shield > 0) {
      const shieldEffectiveDmg = mainDmg * shieldBonus;
      if (target.shield >= shieldEffectiveDmg) {
        target.shield -= shieldEffectiveDmg;
        mainDmg = 0;
      } else {
        const overflow = (shieldEffectiveDmg - target.shield) / shieldBonus;
        target.shield = 0;
        mainDmg = overflow;
      }
    }

    // 3. Remaining damage to Hull
    if (mainDmg > 0) {
      target.health = Math.max(0, target.health - mainDmg);
    }

    // Check Death
    if (target.health <= 0) {
      target.isDead = true;
      target.deaths++;
      target.respawnAt = now + GAME_CONSTANTS.RESPAWN_DELAY;

      // Handle Kill Streak & Bounty for Victim (Reset)
      const victimBounty = target.bounty;
      target.killStreak = 0;
      target.killStreakTier = 'none';
      target.bounty = 0;

      if (attacker && attacker.id !== target.id) {
        attacker.kills++;
        attacker.killStreak++;

        // Determine Kill Streak Tier
        let streakTier: KillStreakTier = 'none';
        if (attacker.killStreak >= 7) streakTier = 'dominating';
        else if (attacker.killStreak >= 5) streakTier = 'rampage';
        else if (attacker.killStreak >= 3) streakTier = 'triple';
        else if (attacker.killStreak >= 2) streakTier = 'double';
        attacker.killStreakTier = streakTier;

        // Assign Bounty to attacker if on 3+ streak
        if (attacker.killStreak >= 3) {
          attacker.bounty = GAME_CONSTANTS.SCORE_BOUNTY_BASE + (attacker.killStreak - 3) * 150;
          if (this.onBountyPlacedCallback) {
            this.onBountyPlacedCallback(attacker.id, attacker.name, attacker.bounty);
          }
        }

        // Award base kill score + Bounty claimed bonus
        let scoreAwarded = GAME_CONSTANTS.SCORE_KILL;
        if (victimBounty > 0) {
          scoreAwarded += victimBounty;
          attacker.bountyCollected = (attacker.bountyCollected || 0) + victimBounty;
          if (this.onBountyClaimedCallback) {
            this.onBountyClaimedCallback(attacker.name, target.name, victimBounty);
          }
        }
        attacker.score += scoreAwarded;

        // Process Assists: determine second highest damage contributor in last 4.5s
        let assistPlayerId: string | undefined;
        let assistPlayerName: string | undefined;
        const targetRecords = this.recentDamageDealt.get(target.id) || [];
        const validRecent = targetRecords.filter((r) => r.attackerId !== attacker.id && now - r.time < 4500);

        if (validRecent.length > 0) {
          validRecent.sort((a, b) => b.damage - a.damage);
          const topAssist = validRecent[0];
          const assistPlayer = this.room.players[topAssist.attackerId];
          if (assistPlayer) {
            assistPlayer.score += GAME_CONSTANTS.SCORE_ASSIST;
            assistPlayer.assists = (assistPlayer.assists || 0) + 1;
            assistPlayerId = assistPlayer.id;
            assistPlayerName = assistPlayer.name;
          }
        }

        const killEv: KillEvent = {
          id: `kill_${now}_${Math.random().toString(36).substring(2, 6)}`,
          killerId: attacker.id,
          killerName: attacker.name,
          victimId: target.id,
          victimName: target.name,
          weapon,
          timestamp: now,
          streak: streakTier !== 'none' ? streakTier : undefined,
          bountyAwarded: victimBounty > 0 ? victimBounty : undefined,
          assistId: assistPlayerId,
          assistName: assistPlayerName,
        };

        this.room.killFeed.unshift(killEv);
        if (this.room.killFeed.length > 8) {
          this.room.killFeed.pop();
        }

        this.onKillCallback(killEv);
      }

      // Clear recent damage history for victim
      this.recentDamageDealt.delete(target.id);
    }
  }

  private respawnPlayer(player: Player, now: number) {
    const spawnPoints = this.map.spawnPoints;
    const randomSpawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    player.x = randomSpawn.x;
    player.y = randomSpawn.y;
    player.vx = 0;
    player.vy = 0;
    player.health = GAME_CONSTANTS.MAX_HULL;
    player.shield = GAME_CONSTANTS.MAX_SHIELD;
    player.isDead = false;
    player.invulnerableUntil = now + GAME_CONSTANTS.INVULNERABLE_TIME;
    player.weapon = player.loadoutWeapon || 'plasma';
    player.activeModifiers = player.loadoutModifiers && player.loadoutModifiers.length > 0 ? [...player.loadoutModifiers] : [];
    player.speedMultiplier = 1.0;
    player.empRemaining = 0;
    player.freezeRemaining = 0;
    player.burnRemaining = 0;
  }

  // --- POWER-UPS & RARITY SYSTEM ---
  private updatePowerUps(now: number) {
    if (now >= this.nextPowerupSpawn && this.room.powerUps.length < 6) {
      this.spawnRandomPowerUp(now);
      this.nextPowerupSpawn = now + (5000 + Math.random() * 4500);
    }

    const remainingPowerUps: PowerUp[] = [];
    let powerUpsChanged = false;
    for (const pu of this.room.powerUps) {
      if (pu.despawnTime && now > pu.despawnTime) {
        powerUpsChanged = true;
        continue; // Despawn
      }

      let pickedUp = false;
      const candidates = this.playerGrid.query(pu.x, pu.y, pu.radius + GAME_CONSTANTS.PLAYER_RADIUS);

      for (const p of candidates) {
        if (p.isDead) continue;
        const dist = Math.hypot(p.x - pu.x, p.y - pu.y);
        if (dist <= GAME_CONSTANTS.PLAYER_RADIUS + pu.radius) {
          pickedUp = true;
          powerUpsChanged = true;
          this.applyPowerUp(p, pu.type);
          p.score += GAME_CONSTANTS.SCORE_POWERUP_COLLECT;
          break;
        }
      }

      if (!pickedUp) {
        remainingPowerUps.push(pu);
      }
    }

    if (powerUpsChanged) {
      this.powerUpsDirty = true;
    }
    this.room.powerUps = remainingPowerUps;
  }

  private spawnRandomPowerUp(now: number) {
    const rarityRoll = Math.random();
    let rarity: PowerUpRarity = 'common';
    let pool: PowerUpType[] = [];

    if (rarityRoll < 0.08) {
      // Legendary (8% chance)
      rarity = 'legendary';
      pool = ['legendary_matrix', 'quad_damage', 'emp_shockwave'];
    } else if (rarityRoll < 0.28) {
      // Epic (20% chance)
      rarity = 'epic';
      pool = ['railgun', 'charge_beam', 'mod_overcharge', 'mod_armor_piercer', 'mod_chain', 'mod_gravity', 'stealth_cloak'];
    } else if (rarityRoll < 0.60) {
      // Rare (32% chance)
      rarity = 'rare';
      pool = ['burst_cannon', 'missile_launcher', 'laser_beam', 'plasma_shotgun', 'ricochet_cannon', 'mod_homing', 'mod_explosive', 'mod_ricochet', 'mod_shield_breaker', 'mod_emp', 'mod_split'];
    } else {
      // Common (40% chance)
      rarity = 'common';
      pool = ['health', 'shield', 'speed', 'spread', 'mod_rapid_fire', 'mod_freeze', 'mod_burn'];
    }

    const type = pool[Math.floor(Math.random() * pool.length)];

    let x = 180 + Math.random() * (this.map.width - 360);
    let y = 180 + Math.random() * (this.map.height - 360);

    for (let attempts = 0; attempts < 10; attempts++) {
      let collides = false;
      for (const obs of this.room.obstacles) {
        if (x >= obs.x - 30 && x <= obs.x + obs.width + 30 && y >= obs.y - 30 && y <= obs.y + obs.height + 30) {
          collides = true;
          break;
        }
      }
      if (!collides) break;
      x = 180 + Math.random() * (this.map.width - 360);
      y = 180 + Math.random() * (this.map.height - 360);
    }

    this.room.powerUps.push({
      id: `pu_${now}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      rarity,
      x,
      y,
      radius: rarity === 'legendary' ? 22 : 18,
      spawnTime: now,
      despawnTime: now + 35000, // 35s lifetime
    });
    this.powerUpsDirty = true;
  }

  private applyPowerUp(player: Player, type: PowerUpType) {
    switch (type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + 45);
        break;
      case 'shield':
        player.shield = Math.min(player.maxShield, player.shield + 65);
        break;
      case 'speed':
        player.speedMultiplier = 1.4;
        player.speedBoostRemaining = 7;
        break;
      case 'quad_damage':
        player.quadDamageRemaining = 8;
        break;
      case 'homing_missile':
        player.homingRemaining = 9;
        break;
      case 'stealth_cloak':
        player.stealthRemaining = 8;
        break;
      case 'emp_shockwave':
        for (const other of Object.values(this.room.players)) {
          if (other.id !== player.id && !other.isDead) {
            if (Math.hypot(other.x - player.x, other.y - player.y) < 550) {
              other.shield = 0;
              other.empRemaining = 4.0;
            }
          }
        }
        break;
      // Weapon pickups
      case 'spread':
      case 'railgun':
      case 'burst_cannon':
      case 'missile_launcher':
      case 'laser_beam':
      case 'plasma_shotgun':
      case 'emp_cannon':
      case 'mine_launcher':
      case 'ricochet_cannon':
      case 'charge_beam':
        player.weapon = type as WeaponType;
        break;
      // Modifier pickups
      case 'mod_homing':
        this.tryAddModifier(player, 'homing');
        break;
      case 'mod_piercing':
        this.tryAddModifier(player, 'piercing');
        break;
      case 'mod_split':
        this.tryAddModifier(player, 'split');
        break;
      case 'mod_explosive':
        this.tryAddModifier(player, 'explosive');
        break;
      case 'mod_ricochet':
        this.tryAddModifier(player, 'ricochet');
        break;
      case 'mod_shield_breaker':
        this.tryAddModifier(player, 'shield_breaker');
        break;
      case 'mod_armor_piercer':
        this.tryAddModifier(player, 'armor_piercer');
        break;
      case 'mod_emp':
        this.tryAddModifier(player, 'emp');
        break;
      case 'mod_rapid_fire':
        this.tryAddModifier(player, 'rapid_fire');
        break;
      case 'mod_overcharge':
        this.tryAddModifier(player, 'overcharge');
        break;
      case 'mod_freeze':
        this.tryAddModifier(player, 'freeze');
        break;
      case 'mod_burn':
        this.tryAddModifier(player, 'burn');
        break;
      case 'mod_gravity':
        this.tryAddModifier(player, 'gravity');
        break;
      case 'mod_chain':
        this.tryAddModifier(player, 'chain');
        break;
      case 'legendary_matrix':
        // Overdrive: full heal, full shield, quad damage + 2 random modifiers
        player.health = player.maxHealth;
        player.shield = player.maxShield;
        player.quadDamageRemaining = 10;
        this.tryAddModifier(player, 'explosive');
        this.tryAddModifier(player, 'overcharge');
        break;
    }
  }

  private tryAddModifier(player: Player, mod: WeaponModifier) {
    const comp = checkModifierCompatibility(player.weapon, mod, player.activeModifiers);
    if (comp.allowed) {
      if (!player.activeModifiers.includes(mod)) {
        if (player.activeModifiers.length >= 3) {
          player.activeModifiers.shift(); // Replace oldest modifier
        }
        player.activeModifiers.push(mod);
      }
    }
  }

  private updateBountyStatus() {
    let topLeader: Player | null = null;
    let maxBounty = 0;

    for (const p of Object.values(this.room.players)) {
      if (!p.isDead && p.bounty > maxBounty) {
        maxBounty = p.bounty;
        topLeader = p;
      }
    }

    if (topLeader && maxBounty >= 150) {
      this.room.bountyLeaderId = topLeader.id;
      this.room.bountyAmount = maxBounty;
    } else {
      this.room.bountyLeaderId = undefined;
      this.room.bountyAmount = undefined;
    }
  }

  private updateBoss(now: number, dt: number) {
    if (!this.room.boss || this.room.boss.health <= 0) return;
    const boss = this.room.boss;

    // Find closest alive player
    let closestPlayer: Player | null = null;
    let closestDist = Infinity;
    for (const p of Object.values(this.room.players)) {
      if (p.isDead) continue;
      const d = Math.hypot(p.x - boss.x, p.y - boss.y);
      if (d < closestDist) {
        closestDist = d;
        closestPlayer = p;
      }
    }

    if (closestPlayer) {
      boss.targetId = closestPlayer.id;
      const targetAngle = Math.atan2(closestPlayer.y - boss.y, closestPlayer.x - boss.x);
      // Smoothly rotate toward player
      boss.angle += (targetAngle - boss.angle) * 0.05;

      // Boss movement: drift toward player but maintain arena presence
      const baseSpeed = boss.isEnraged ? 85 : 55;
      const moveX = Math.cos(targetAngle);
      const moveY = Math.sin(targetAngle);
      boss.vx += (moveX * baseSpeed - boss.vx) * 0.04;
      boss.vy += (moveY * baseSpeed - boss.vy) * 0.04;
    } else {
      boss.angle += 0.01;
    }

    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;

    // Arena boundary constraints
    const pad = boss.radius + 160;
    boss.x = Math.max(pad, Math.min(this.map.width - pad, boss.x));
    boss.y = Math.max(pad, Math.min(this.map.height - pad, boss.y));

    // Shield passive regeneration + shield guard active conduit
    const activeShieldGuards = (boss.minions || []).filter((m) => m.health > 0 && m.type === 'shield_guard').length;
    const shieldRegenRate = 25 + activeShieldGuards * 60; // Shield guards actively boost Boss shield recharge!
    if (boss.shield < boss.maxShield) {
      boss.shield = Math.min(boss.maxShield, boss.shield + shieldRegenRate * dt);
    }

    // Process Mini-NPC minions (spawn, movement, attack, kamikaze)
    if (!boss.minions) boss.minions = [];
    
    // Spawn mini-NPCs periodically if count < 6
    if (boss.minions.length < 6 && Math.random() < 0.03) {
      const minionAngle = Math.random() * Math.PI * 2;
      const minionType: 'drone' | 'kamikaze' | 'shield_guard' =
        boss.phase === 3 ? 'kamikaze' : (Math.random() < 0.5 ? 'drone' : 'shield_guard');
      const minionHp = minionType === 'shield_guard' ? 450 : minionType === 'kamikaze' ? 220 : 320;
      boss.minions.push({
        id: `minion_${now}_${Math.random().toString(36).slice(2, 6)}`,
        x: boss.x + Math.cos(minionAngle) * (boss.radius + 60),
        y: boss.y + Math.sin(minionAngle) * (boss.radius + 60),
        vx: 0,
        vy: 0,
        angle: minionAngle,
        health: minionHp,
        maxHealth: minionHp,
        radius: minionType === 'shield_guard' ? 22 : 18,
        type: minionType,
      });
    }

    // Update active minions
    const aliveMinions: BossMinion[] = [];
    const alivePlayers = Object.values(this.room.players).filter((p) => !p.isDead);

    for (const m of boss.minions) {
      if (m.health <= 0) continue;

      // Find closest player to minion
      let targetP: Player | null = null;
      let minionDist = Infinity;
      for (const p of alivePlayers) {
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        if (d < minionDist) {
          minionDist = d;
          targetP = p;
        }
      }

      if (targetP) {
        const ang = Math.atan2(targetP.y - m.y, targetP.x - m.x);
        m.angle = ang;
        const spd = m.type === 'kamikaze' ? 160 : m.type === 'shield_guard' ? 80 : 110;
        m.vx += (Math.cos(ang) * spd - m.vx) * 0.08;
        m.vy += (Math.sin(ang) * spd - m.vy) * 0.08;

        // Kamikaze detonation against player
        if (m.type === 'kamikaze' && minionDist <= m.radius + GAME_CONSTANTS.PLAYER_RADIUS + 15) {
          this.applyDamageToPlayer(targetP, 45, 'boss', 'plasma', now);
          this.detonateExplosion(m.x, m.y, 90, 40, 'boss', 'plasma', now);
          m.health = 0; // destroyed
          continue;
        }

        // Drone shooting at players
        if (m.type === 'drone' && minionDist < 600 && Math.random() < 0.02) {
          this.room.projectiles.push({
            id: `minion_shot_${now}_${Math.random()}`,
            ownerId: 'boss',
            ownerName: 'Мини-Дрон Босса',
            weaponType: 'plasma',
            x: m.x + Math.cos(ang) * (m.radius + 5),
            y: m.y + Math.sin(ang) * (m.radius + 5),
            vx: Math.cos(ang) * 400,
            vy: Math.sin(ang) * 400,
            damage: 18,
            color: '#f43f5e',
            radius: 7,
            createdAt: now,
            expiresAt: now + 2500,
          });
        }
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      aliveMinions.push(m);
    }
    boss.minions = aliveMinions;

    // Attacks
    if (now >= this.nextBossAttackTime) {
      this.executeBossAttack(now, closestPlayer);
    }
  }

  private executeBossAttack(now: number, target: Player | null) {
    if (!this.room.boss || this.room.boss.health <= 0) return;
    const boss = this.room.boss;

    if (boss.phase === 3) {
      // PHASE 3: HYPER NOVA BARRAGE (16 projectiles in 360-degree circle)
      boss.attackName = 'ГИПЕР-НОВА';
      const count = 16;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + (now * 0.002);
        const speed = 360;
        this.room.projectiles.push({
          id: `boss_nova_${now}_${i}`,
          ownerId: 'boss',
          ownerName: 'ТИТАН ПУСТОТЫ',
          weaponType: 'plasma',
          x: boss.x + Math.cos(ang) * (boss.radius + 10),
          y: boss.y + Math.sin(ang) * (boss.radius + 10),
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          damage: 32,
          color: '#f43f5e',
          radius: 12,
          createdAt: now,
          expiresAt: now + 3500,
        });
      }
      this.nextBossAttackTime = now + 2400;
    } else if (boss.phase === 2) {
      // PHASE 2: 4 HOMING MISSILES
      boss.attackName = 'САМОНАВОДЯЩИЕСЯ ТОРПЕДЫ';
      const players = Object.values(this.room.players).filter((p) => !p.isDead);
      for (let i = 0; i < 4; i++) {
        const targetP = players[i % players.length] || target;
        const baseAngle = boss.angle + ((i - 1.5) * 0.5);
        this.room.projectiles.push({
          id: `boss_missile_${now}_${i}`,
          ownerId: 'boss',
          ownerName: 'ТИТАН ПУСТОТЫ',
          weaponType: 'missile_launcher',
          x: boss.x + Math.cos(baseAngle) * (boss.radius + 15),
          y: boss.y + Math.sin(baseAngle) * (boss.radius + 15),
          vx: Math.cos(baseAngle) * 290,
          vy: Math.sin(baseAngle) * 290,
          damage: 40,
          color: '#a855f7',
          radius: 10,
          createdAt: now,
          expiresAt: now + 4000,
          homing: true,
          explosionRadius: 75,
        });
      }
      this.nextBossAttackTime = now + 3200;
    } else {
      // PHASE 1: DUAL HEAVY PLASMA BURSTS TOWARDS TARGET
      boss.attackName = 'ПЛАЗМЕННЫЙ ЗАЛП';
      if (target) {
        const ang = Math.atan2(target.y - boss.y, target.x - boss.x);
        for (const offset of [-0.25, 0.25]) {
          const finalAngle = ang + offset;
          this.room.projectiles.push({
            id: `boss_plasma_${now}_${offset}`,
            ownerId: 'boss',
            ownerName: 'ТИТАН ПУСТОТЫ',
            weaponType: 'plasma',
            x: boss.x + Math.cos(finalAngle) * (boss.radius + 10),
            y: boss.y + Math.sin(finalAngle) * (boss.radius + 10),
            vx: Math.cos(finalAngle) * 440,
            vy: Math.sin(finalAngle) * 440,
            damage: 26,
            color: '#ec4899',
            radius: 9,
            createdAt: now,
            expiresAt: now + 3000,
          });
        }
      }
      this.nextBossAttackTime = now + 1500;
    }
  }

  private applyDamageToBoss(damage: number, attackerId: string, now: number) {
    if (!this.room.boss || this.room.boss.health <= 0) return;
    const b = this.room.boss;

    // Active shield guards absorb 30% of incoming damage to the boss's shields!
    const activeShieldGuards = (b.minions || []).filter((m) => m.health > 0 && m.type === 'shield_guard').length;
    const effectiveDamage = activeShieldGuards > 0 && b.shield > 0 ? damage * 0.7 : damage;

    if (b.shield > 0) {
      if (b.shield >= effectiveDamage) {
        b.shield -= effectiveDamage;
      } else {
        const remaining = effectiveDamage - b.shield;
        b.shield = 0;
        b.health = Math.max(0, b.health - remaining);
      }
    } else {
      b.health = Math.max(0, b.health - effectiveDamage);
    }

    const hpRatio = b.health / b.maxHealth;
    if (hpRatio <= 0.33) {
      b.phase = 3;
      b.isEnraged = true;
    } else if (hpRatio <= 0.66) {
      b.phase = 2;
    } else {
      b.phase = 1;
    }

    b.damageContribution[attackerId] = (b.damageContribution[attackerId] || 0) + damage;

    const attacker = this.room.players[attackerId];
    if (attacker) {
      attacker.score = (attacker.score || 0) + Math.round(damage * 0.1);
      attacker.damageDealt = (attacker.damageDealt || 0) + damage;
    }

    let maxDmg = 0;
    let mvpId = '';
    for (const [pid, dmg] of Object.entries(b.damageContribution)) {
      if (dmg > maxDmg) {
        maxDmg = dmg;
        mvpId = pid;
      }
    }
    b.mvpPlayerId = mvpId;
    b.mvpPlayerName = this.room.players[mvpId]?.name || 'Pilot';

    if (b.health <= 0) {
      this.handleBossDeath(now);
    }
  }

  private handleBossDeath(_now: number) {
    if (!this.room.boss) return;
    const b = this.room.boss;
    b.health = 0;

    let highestDmg = 0;
    let mvpId = this.room.boss.mvpPlayerId || '';
    for (const [pid, dmg] of Object.entries(b.damageContribution)) {
      if (dmg > highestDmg) {
        highestDmg = dmg;
        mvpId = pid;
      }
    }

    const mvpPlayer = this.room.players[mvpId] || Object.values(this.room.players)[0];
    if (mvpPlayer) {
      mvpPlayer.score += 2500;
      mvpPlayer.kills += 5;
    }

    for (const p of Object.values(this.room.players)) {
      p.score += 1000;
    }

    this.endGame();
  }

  private endGame() {
    this.stop();
    this.room.status = 'game_over';

    const scores: PlayerScoreSummary[] = Object.values(this.room.players)
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        cosmetics: p.cosmetics,
        score: p.score,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        damageDealt: Math.round(p.damageDealt),
        accuracy: p.shotsFired > 0 ? Math.round((p.shotsHit / p.shotsFired) * 100) : 0,
        killStreak: p.killStreak,
        bountyCollected: p.bountyCollected || 0,
        isBot: p.isBot,
      }))
      .sort((a, b) => b.score - a.score);

    const winner = scores[0] || {
      id: 'none',
      name: 'None',
      color: '#fff',
      score: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      accuracy: 0,
      killStreak: 0,
    };

    this.onGameOverCallback(scores, winner);
  }
}
