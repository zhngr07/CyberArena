export type WeaponType =
  | 'plasma'
  | 'spread'
  | 'railgun'
  | 'burst_cannon'
  | 'missile_launcher'
  | 'laser_beam'
  | 'plasma_shotgun'
  | 'emp_cannon'
  | 'mine_launcher'
  | 'ricochet_cannon'
  | 'charge_beam';

export type WeaponModifier =
  | 'split'
  | 'explosive'
  | 'ricochet'
  | 'overcharge'
  | 'shield_breaker'
  | 'armor_piercer'
  | 'emp'
  | 'burn'
  | 'freeze'
  | 'gravity'
  | 'chain';

export type ModifierTier = 1 | 2 | 3;

export interface PlayerModifier {
  type: WeaponModifier;
  tier: ModifierTier;
}

export type ShipModelType =
  | 'phantom'
  | 'dragon'
  | 'raven'
  | 'dreadnought'
  | 'ufo'
  | 'phoenix'
  | 'viper'
  | 'specter'
  | 'titan'
  | 'valkyrie'
  | 'interceptor'
  | 'nebula'
  | 'hyperion'
  | 'chronos'
  | 'eclipse'
  | 'vortex'
  | 'aurora'
  | 'chimera'
  | 'tempest'
  | 'pulsar'
  | 'scythe'
  | 'kraken'
  | 'solaris'
  | 'abyss'
  | 'sentinel';

export type HatType =
  | 'none'
  | 'crown'
  | 'visor'
  | 'horns'
  | 'halo'
  | 'samurai'
  | 'headset'
  | 'cyber_shades'
  | 'neon_horns'
  | 'viking_helmet'
  | 'golden_monocle'
  | 'pilot_goggles'
  | 'ninja_headband'
  | 'pirate_tricorne'
  | 'plasma_antennae'
  | 'cyber_mask'
  | 'quantum_hood'
  | 'imperial_helm';

export type AccessoryType =
  | 'none'
  | 'energy_wings'
  | 'orbit_drone'
  | 'cyber_tail'
  | 'ring_of_fire'
  | 'nano_shield_aura'
  | 'plasma_fins'
  | 'quantum_spikes'
  | 'photon_cape'
  | 'holo_emblem'
  | 'warp_crystal'
  | 'satellite_dish';

export type TrailType =
  | 'default'
  | 'fire'
  | 'lightning'
  | 'rainbow'
  | 'matrix'
  | 'stars'
  | 'plasma_purple'
  | 'quantum_cyan'
  | 'toxic_acid'
  | 'solar_gold'
  | 'hyperdrive_red'
  | 'void_blackhole'
  | 'ice_comet'
  | 'bubble_neon'
  | 'glitch_binary'
  | 'cherry_blossom';

export type TitleType =
  | 'rookie'
  | 'sniper'
  | 'slayer'
  | 'untouchable'
  | 'legend'
  | 'warlord'
  | 'titan_slayer'
  | 'void_walker'
  | 'cyber_god'
  | 'apex_predator'
  | 'phantom_ghost';

export interface PlayerCosmetics {
  shipModel: ShipModelType;
  hat: HatType;
  accessory?: AccessoryType;
  trail: TrailType;
  title: TitleType;
}

export interface BossMinion {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  radius: number;
  targetId?: string;
  type: 'drone' | 'kamikaze' | 'shield_guard';
}

export interface Vector2D {
  x: number;
  y: number;
}

export type KillStreakTier = 'none' | 'double' | 'triple' | 'rampage' | 'dominating';

export interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  disconnected?: boolean;
  ping: number;
  cosmetics?: PlayerCosmetics;
  team?: 'blue' | 'red';
  // Spatial & physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  // Combat stats (Split Shield & Hull system)
  health: number; // Hull health (0-100)
  maxHealth: number;
  shield: number; // Energy shield (0-100)
  maxShield: number;
  score: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  // Progression & Bounties
  killStreak: number;
  killStreakTier: KillStreakTier;
  bounty: number; // Bounty points awarded for eliminating this player
  bountyCollected?: number;
  assists?: number;
  // Weapon & Build System
  weapon: WeaponType;
  activeModifiers: WeaponModifier[];
  loadoutWeapon?: WeaponType;
  loadoutModifiers?: WeaponModifier[];
  chargeLevel?: number; // 0 to 1 for charge beam
  isCharging?: boolean;
  // Movement & Abilities
  isDashing: boolean;
  dashCooldown: number; // 0 when ready
  speedMultiplier: number;
  speedBoostRemaining: number;
  invulnerableUntil: number;
  isDead: boolean;
  respawnAt: number;
  // Status effects
  empRemaining?: number; // EMP disables shield regen & slows dash cooldown
  freezeRemaining?: number; // Slows movement speed
  burnRemaining?: number; // Damage over time
  lastDamageTime?: number; // Timestamp for shield regeneration timer
  // Buffs
  quadDamageRemaining?: number;
  stealthRemaining?: number;
  lastProcessedSeq?: number;
}

export interface Bullet {
  id: string;
  ownerId: string;
  ownerName: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  weaponType: WeaponType;
  modifiers?: WeaponModifier[];
  bouncesLeft?: number; // For ricochet
  isMine?: boolean; // For mine launcher
  armed?: boolean; // Mine proximity arm status
  explosionRadius?: number; // For explosive & missiles
  isBeam?: boolean; // Instant laser beam segment
  beamEndX?: number;
  beamEndY?: number;
  chargeLevel?: number;
  createdAt: number;
  expiresAt: number;
}

export type PowerUpRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type PowerUpType =
  | 'health'
  | 'shield'
  | 'spread'
  | 'railgun'
  | 'burst_cannon'
  | 'missile_launcher'
  | 'laser_beam'
  | 'plasma_shotgun'
  | 'emp_cannon'
  | 'mine_launcher'
  | 'ricochet_cannon'
  | 'charge_beam'
  | 'speed'
  | 'quad_damage'
  | 'stealth_cloak'
  | 'emp_shockwave'
  | 'mod_split'
  | 'mod_explosive'
  | 'mod_ricochet'
  | 'mod_shield_breaker'
  | 'mod_armor_piercer'
  | 'mod_emp'
  | 'mod_overcharge'
  | 'mod_freeze'
  | 'mod_burn'
  | 'mod_gravity'
  | 'mod_chain'
  | 'legendary_matrix';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  rarity: PowerUpRarity;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  despawnTime?: number;
}

export type ObstacleType =
  | 'barrier'
  | 'explosive_core'
  | 'bumper'
  | 'portal'
  | 'gravity_well';

export interface MapObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  health?: number;
  maxHealth?: number;
  targetPortalId?: string; // Connected destination portal
  pullRadius?: number; // For gravity wells
  pullForce?: number;
}

export interface GameMap {
  id: string;
  name: string;
  nameRu?: string;
  nameEn?: string;
  theme: string;
  width: number;
  height: number;
  obstacles: MapObstacle[];
  spawnPoints: Vector2D[];
  description?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  gameplayFeature?: string;
  gameplayFeatureRu?: string;
  gameplayFeatureEn?: string;
  openCoverRatio?: string;
  openCoverRatioRu?: string;
  keyTactics?: string[];
  keyTacticsRu?: string[];
  keyTacticsEn?: string[];
  events?: DynamicEventType[];
}

export type DynamicEventType =
  | 'METEOR_SHOWER'
  | 'GRAVITY_STORM'
  | 'SOLAR_FLARE'
  | 'BLACKOUT'
  | 'WORMHOLE_SURGE'
  | 'ENERGY_OVERLOAD'
  | 'NEBULA_PLASMA_SURGE'
  | 'ION_CLOUD_STEALTH'
  | 'KINETIC_RESONANCE'
  | 'GEODE_BURST'
  | 'AIRLOCK_DEPRESSURIZATION'
  | 'STATION_SECURITY_GRID'
  | 'CRYSTAL_PRISM_BURST'
  | 'CRYSTALLINE_REGENERATION'
  | 'SINGULARITY_COLLAPSE'
  | 'ANTIMATTER_PULSE'
  | 'ORBITAL_BOMBARDMENT'
  | 'DARK_MATTER_PULSE';

export interface DynamicEventHazard {
  x: number;
  y: number;
  radius: number;
  progress: number; // 0 to 1 before strike
  hazardType?: 'meteor' | 'laser_beam' | 'antimatter_ring' | 'singularity' | 'rift' | 'geode_shard';
  x2?: number;
  y2?: number;
  width?: number;
  speed?: number;
}

export interface DynamicEventState {
  type: DynamicEventType;
  phase: 'warning' | 'active';
  name: string;
  nameRu?: string;
  nameEn?: string;
  description: string;
  descriptionRu?: string;
  descriptionEn?: string;
  warningSecondsLeft: number;
  activeSecondsLeft: number;
  hazards?: DynamicEventHazard[];
}

export interface KillEvent {
  id: string;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weapon: WeaponType;
  timestamp: number;
  streak?: KillStreakTier;
  bountyAwarded?: number;
  assistId?: string;
  assistName?: string;
}

export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'game_over';
export type GameMode = 'ffa' | 'tdm' | 'koth' | 'boss_raid';

export interface BossState {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  phase: 1 | 2 | 3 | 4;
  isEnraged: boolean;
  radius: number;
  targetId?: string;
  attackName?: string;
  damageContribution: Record<string, number>; // playerId -> damage dealt
  mvpPlayerId?: string;
  mvpPlayerName?: string;
  minions?: BossMinion[];
}

export interface RoomState {
  code: string;
  hostId: string;
  status: RoomStatus;
  gameMode: GameMode;
  countdown: number;
  matchTimeRemaining: number;
  matchDuration: number;
  mapId: string;
  players: Record<string, Player>;
  projectiles: Bullet[];
  powerUps: PowerUp[];
  obstacles: MapObstacle[];
  killFeed: KillEvent[];
  winnerId?: string;
  currentEvent?: DynamicEventState | null;
  bountyLeaderId?: string;
  bountyAmount?: number;
  boss?: BossState | null;
  matchId?: string;
  matchStartTime?: number;
  isRanked?: boolean;
}

export type MatchStatus = 'completed' | 'draw' | 'aborted';

export interface MatchParticipantSummary {
  id: string;
  name: string;
  isBot: boolean;
  team?: 'blue' | 'red';
  score: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  assists: number;
  killStreak: number;
  isWinner: boolean;
  disconnected?: boolean;
  ratingDelta?: number;
  newRating?: number;
}

export interface MatchResult {
  id: string;
  roomCode: string;
  mode: GameMode;
  mapId: string;
  status: MatchStatus;
  isRanked?: boolean;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  winnerId: string | null;
  winnerName: string | null;
  participants: MatchParticipantSummary[];
  bossDefeated?: boolean;
  bossDamageDealt?: number;
}

export interface PlayerScoreSummary {
  id: string;
  name: string;
  color: string;
  score: number;
  kills: number;
  deaths: number;
  assists?: number;
  damageDealt: number;
  accuracy: number;
  killStreak: number;
  bountyCollected?: number;
  isBot?: boolean;
  cosmetics?: PlayerCosmetics;
}

// Client to server input packet (compact)
export interface PlayerInput {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  angle: number; // in radians
  shooting: boolean;
  dashing: boolean;
  chargeBeam?: boolean; // For charging beam cannon
  clientTime: number;
  seq?: number;
}

export interface NetworkStats {
  ping: number;
  avgPing: number;
  minPing: number;
  maxPing: number;
  jitter: number;
  packetLoss: number;
  packetsInPerSec: number;
  packetsOutPerSec: number;
  bytesInPerSec: number;
  bytesOutPerSec: number;
  totalMessagesIn: number;
  totalMessagesOut: number;
  reconnectCount: number;
  region: string;
  serverTickRate: number;
  lossRate?: number;
  activeTransport?: 'webtransport' | 'websocket';
  transportStatus?: string;
  webTransportSupported?: boolean;
  physicalHost?: string;
  perceivedInputLag?: number;
}

// Server region probe interface
export interface ServerRegionInfo {
  id: string;
  name: string;
  flag: string;
  ping: number;
  status: 'optimal' | 'good' | 'fair' | 'high';
  isAutoRecommended?: boolean;
}

// Network messages
export type ClientMessage =
  | { type: 'create_room'; playerName: string; playerColor: string; mapId?: string; gameMode?: GameMode; cosmetics?: PlayerCosmetics; initialWeapon?: WeaponType; initialModifiers?: WeaponModifier[] }
  | { type: 'join_room'; roomCode: string; playerName: string; playerColor: string; reconnectToken?: string; cosmetics?: PlayerCosmetics; initialWeapon?: WeaponType; initialModifiers?: WeaponModifier[] }
  | { type: 'update_loadout'; weapon?: WeaponType; modifiers?: WeaponModifier[] }
  | { type: 'update_cosmetics'; cosmetics: PlayerCosmetics }
  | { type: 'toggle_ready' }
  | { type: 'add_bot' }
  | { type: 'kick_player'; targetId: string }
  | { type: 'change_map'; mapId: string }
  | { type: 'change_mode'; mode: GameMode }
  | { type: 'start_game' }
  | { type: 'input'; input: PlayerInput }
  | { type: 'play_again' }
  | { type: 'leave_room' }
  | { type: 'ping'; timestamp: number; regionHint?: string; lastRtt?: number };

export type ServerMessage =
  | { type: 'joined'; player: Player; room: RoomState; reconnectToken: string }
  | { type: 'room_snapshot'; room: RoomState }
  | {
      type: 'game_tick';
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
    }
  | { type: 'countdown_tick'; count: number }
  | { type: 'game_started' }
  | { type: 'kill'; kill: KillEvent }
  | { type: 'perfect_dash'; playerId: string; bonusScore: number }
  | { type: 'bounty_placed'; playerId: string; playerName: string; bounty: number }
  | { type: 'bounty_claimed'; killerName: string; victimName: string; bounty: number }
  | { type: 'event_alert'; event: DynamicEventState }
  | { type: 'game_over'; scores: PlayerScoreSummary[]; winner: PlayerScoreSummary; matchResult?: MatchResult }
  | { type: 'player_disconnected'; playerId: string; name: string }
  | { type: 'player_reconnected'; playerId: string; name: string }
  | { type: 'error'; message: string }
  | { type: 'pong'; clientTime: number; serverTime: number };
