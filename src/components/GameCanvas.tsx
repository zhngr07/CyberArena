import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  BossState,
  Bullet,
  GameMap,
  KillEvent,
  MapObstacle,
  NetworkStats,
  Player,
  PlayerInput,
  PowerUp,
  ShipModelType,
  HatType,
  AccessoryType,
  TrailType,
} from '../types/game.ts';
import { MAPS } from '../data/maps.ts';
import { GAME_CONSTANTS, WEAPONS, MODIFIER_METAS } from '../data/weapons.ts';
import { soundManager } from '../services/audio.ts';
import { networkManager } from '../services/network.ts';
import { Shield, Zap, Crosshair, Trophy, Activity, Sliders, Radio, ChevronDown, ChevronUp, Settings, LogOut } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations.ts';
import { NetworkDebugOverlay } from './NetworkDebugOverlay.tsx';
import { MobileVirtualControls } from './MobileVirtualControls.tsx';
import { OrientationWarning } from './OrientationWarning.tsx';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation.ts';
import { MobileControlSettings, DEFAULT_MOBILE_SETTINGS, triggerHaptic } from '../types/mobileControls.ts';
import { calculateAimAssist } from '../services/aimAssist.ts';
import {
  drawProceduralShipHull,
  drawShipHats,
  drawShipAccessories,
  getTrailParticleStyle,
} from './renderShipCosmetics.ts';

interface GameCanvasProps {
  localPlayerId: string;
  mapId: string;
  timeRemaining: number;
  players: Record<string, Partial<Player>>;
  projectiles: Bullet[];
  powerUps: PowerUp[];
  obstacles: MapObstacle[];
  killFeed: KillEvent[];
  latency: number;
  lang: Language;
  uiScale?: number;
  showDebug?: boolean;
  onToggleDebug?: (show: boolean) => void;
  fpsBoost?: boolean;
  onToggleFpsBoost?: (boost: boolean) => void;
  mobileSettings?: MobileControlSettings;
  boss?: BossState | null;
  onOpenSettings?: () => void;
  onSendInput: (input: PlayerInput) => void;
  onExitGame?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'smoke' | 'matrix' | 'star';
}

interface EntityTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetX: number;
  targetY: number;
  targetVx: number;
  targetVy: number;
  targetAngle: number;
}

interface PendingInput {
  seq: number;
  moveX: number;
  moveY: number;
  angle: number;
  shooting: boolean;
  dashing: boolean;
  dt: number;
  time: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  localPlayerId,
  mapId,
  timeRemaining,
  players,
  projectiles,
  powerUps,
  obstacles,
  killFeed,
  latency,
  lang,
  uiScale = 1.0,
  showDebug = false,
  onToggleDebug,
  fpsBoost = true,
  onToggleFpsBoost,
  mobileSettings = DEFAULT_MOBILE_SETTINGS,
  boss,
  onOpenSettings,
  onExitGame,
  onSendInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const map: GameMap =
    MAPS[mapId] ||
    MAPS['neon_grid'] ||
    MAPS['asteroid_field'] ||
    Object.values(MAPS)[0] || {
      id: 'neon_grid',
      name: 'Cyber Neon Grid',
      theme: 'cyan',
      width: 2400,
      height: 1600,
      description: 'Default Arena',
      gameplayFeature: 'Balanced',
      obstacles: [],
      spawnPoints: [{ x: 500, y: 500 }, { x: 1900, y: 1100 }],
    };
  const mapWidth = map?.width || 2400;
  const mapHeight = map?.height || 1600;
  const t = TRANSLATIONS[lang];

  // Boss state reference
  const bossRef = useRef<BossState | null>(boss || null);
  useEffect(() => {
    bossRef.current = boss || null;
  }, [boss]);

  // Device & Orientation evaluation
  const {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isPortrait,
    isLandscape,
    width: screenWidth,
    height: screenHeight,
    portraitDismissed,
    dismissPortraitWarning,
  } = useDeviceOrientation();

  const [showMobileRadar, setShowMobileRadar] = useState(false);

  // Mobile settings reference
  const mobileSettingsRef = useRef<MobileControlSettings>(mobileSettings);
  useEffect(() => {
    mobileSettingsRef.current = mobileSettings;
  }, [mobileSettings]);

  // Virtual mobile controls input state (multi-touch isolated)
  const virtualMove = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const virtualAim = useRef<{ angle: number | null; isShooting: boolean }>({ angle: null, isShooting: false });
  const virtualFire = useRef<boolean>(false);
  const virtualDash = useRef<boolean>(false);

  // Store frequently accessed props in refs for continuous, unthrottled 60-144 FPS rendering
  const fpsBoostRef = useRef<boolean>(fpsBoost);
  useEffect(() => {
    fpsBoostRef.current = fpsBoost;
  }, [fpsBoost]);

  const mapRef = useRef<GameMap>(map);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const langRef = useRef<Language>(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const onSendInputRef = useRef(onSendInput);
  useEffect(() => {
    onSendInputRef.current = onSendInput;
  }, [onSendInput]);

  // Network Performance state
  const [networkStats, setNetworkStats] = useState<NetworkStats>(() => networkManager.stats);

  useEffect(() => {
    const unsub = networkManager.onStats((stats) => {
      setNetworkStats(stats);
    });
    return () => {
      unsub();
    };
  }, []);

  // Direct snapshot refs for zero-latency 60-144 FPS rendering
  const serverPlayersRef = useRef<Record<string, Partial<Player>>>(players);
  const serverObstaclesRef = useRef<MapObstacle[]>(obstacles);
  const serverPowerUpsRef = useRef<PowerUp[]>(powerUps);

  // Keep refs in sync when props update
  useEffect(() => {
    serverPlayersRef.current = players;
  }, [players]);
  useEffect(() => {
    serverObstaclesRef.current = obstacles;
  }, [obstacles]);
  useEffect(() => {
    serverPowerUpsRef.current = powerUps;
  }, [powerUps]);

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDown = useRef<boolean>(false);

  // Client-Side Prediction State for Local Player (Immediate response!)
  const localPredictedPos = useRef<{ x: number; y: number; vx: number; vy: number; angle: number }>({
    x: 400,
    y: 400,
    vx: 0,
    vy: 0,
    angle: 0,
  });

  // Authoritative Reconciliation & Input Queue Buffer
  const pendingInputs = useRef<PendingInput[]>([]);
  const lastAcknowledgedSeq = useRef<number>(0);
  const visualReconcileOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Visual position with linear interpolation (lerp) smoothing for local player
  const localVisualPos = useRef<{ x: number; y: number }>({ x: 400, y: 400 });
  const isSpawnInitialized = useRef<boolean>(false);

  // Entity Interpolation map for remote players
  const remoteInterpolated = useRef<Map<string, EntityTarget>>(new Map());

  // Local Projectile Simulation (Continuous smooth flight between server ticks)
  const localProjectiles = useRef<Bullet[]>([]);

  // Camera tracking
  const camera = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const screenShake = useRef<number>(0);
  const particles = useRef<Particle[]>([]);

  // Real-time FPS tracker
  const [fps, setFps] = useState<number>(60);
  const frameCount = useRef<number>(0);
  const lastFpsCheck = useRef<number>(performance.now());

  // Mobile touch controls state
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const touchMoveStart = useRef<{ x: number; y: number } | null>(null);
  const touchMoveCurrent = useRef<{ x: number; y: number } | null>(null);
  const touchAimCurrent = useRef<{ angle: number; shooting: boolean }>({ angle: 0, shooting: false });
  const touchMoveIdentifier = useRef<number | null>(null);
  const touchAimIdentifier = useRef<number | null>(null);

  // Sound triggers
  const prevDead = useRef<boolean>(false);
  const prevShield = useRef<number>(100);
  const prevHealth = useRef<number>(100);

  // Decoupled HUD state: updates at ~6 Hz or instantly on damage, eliminating React render freezes
  const [, setHudTick] = useState<number>(0);
  const lastHudUpdateTime = useRef<number>(0);

  const localPlayer = serverPlayersRef.current[localPlayerId] || players[localPlayerId];
  const localPlayerRef = useRef<Partial<Player> | undefined>(localPlayer);
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Sync projectiles smoothly when server updates arrive
  useEffect(() => {
    localProjectiles.current = projectiles.map((b) => ({ ...b }));
  }, [projectiles]);

  /**
   * Linear interpolation (lerp) helper function.
   */
  const lerp = useCallback((start: number, end: number, alpha: number): number => {
    return start + (end - start) * Math.max(0, Math.min(1, alpha));
  }, []);

  /**
   * Linear interpolation (lerp) based smoothing function for the local player's visual position.
   * Smoothly reconciles client prediction with server updates, eliminating snapping, camera hitching,
   * and jitter while preserving instant 0ms input responsiveness.
   */
  const smoothLocalVisualPosition = useCallback(
    (dt: number) => {
      // Lerp reconciliation counter-offset towards zero using frame-rate independent alpha
      const offsetAlpha = 1 - Math.exp(-22 * dt);
      visualReconcileOffset.current.x = lerp(visualReconcileOffset.current.x, 0, offsetAlpha);
      visualReconcileOffset.current.y = lerp(visualReconcileOffset.current.y, 0, offsetAlpha);

      if (Math.abs(visualReconcileOffset.current.x) < 0.005) visualReconcileOffset.current.x = 0;
      if (Math.abs(visualReconcileOffset.current.y) < 0.005) visualReconcileOffset.current.y = 0;

      // Instantaneous responsive render position: predicted position + smooth decaying reconciliation offset
      localVisualPos.current.x = localPredictedPos.current.x + visualReconcileOffset.current.x;
      localVisualPos.current.y = localPredictedPos.current.y + visualReconcileOffset.current.y;
    },
    [lerp]
  );

  // TRUE SERVER RECONCILIATION
  // Replays unacknowledged inputs from the authoritative server position.
  // Completely eliminates backward rubber-banding and position jitter!
  const reconcileLocalPlayer = useCallback(
    (lp: Partial<Player>, currentObstacles: MapObstacle[]) => {
      if (lp.x === undefined || lp.y === undefined) return;

      const serverSeq = lp.lastProcessedSeq ?? 0;

      // Reset on initial spawn, death, or respawn
      if (!isSpawnInitialized.current || lp.isDead || (prevDead.current && !lp.isDead)) {
        if (!lp.isDead) {
          isSpawnInitialized.current = true;
        }
        localPredictedPos.current.x = lp.x;
        localPredictedPos.current.y = lp.y;
        localPredictedPos.current.vx = lp.vx || 0;
        localPredictedPos.current.vy = lp.vy || 0;
        localVisualPos.current.x = lp.x;
        localVisualPos.current.y = lp.y;
        pendingInputs.current = [];
        visualReconcileOffset.current = { x: 0, y: 0 };
        return;
      }

      // Discard inputs that have already been acknowledged by the server
      if (serverSeq > lastAcknowledgedSeq.current) {
        lastAcknowledgedSeq.current = serverSeq;
        pendingInputs.current = pendingInputs.current.filter((inp) => inp.seq > serverSeq);
      }

      // Replay all remaining unacknowledged inputs starting from authoritative server position
      let simX = lp.x;
      let simY = lp.y;
      let simVx = lp.vx || 0;
      let simVy = lp.vy || 0;
      const speed = GAME_CONSTANTS.BASE_SPEED * (lp.speedMultiplier || 1.0);
      const r = GAME_CONSTANTS.PLAYER_RADIUS;

      for (const inp of pendingInputs.current) {
        const mag = Math.hypot(inp.moveX, inp.moveY);
        const normX = mag > 0 ? inp.moveX / mag : 0;
        const normY = mag > 0 ? inp.moveY / mag : 0;

        if (inp.dashing) {
          simX += simVx * inp.dt;
          simY += simVy * inp.dt;
        } else if (mag > 0) {
          simVx = normX * speed;
          simVy = normY * speed;
          simX += simVx * inp.dt;
          simY += simVy * inp.dt;
        } else {
          simVx *= 0.85;
          simVy *= 0.85;
          simX += simVx * inp.dt;
          simY += simVy * inp.dt;
        }

        // Arena boundary collision
        simX = Math.max(r, Math.min(mapWidth - r, simX));
        simY = Math.max(r, Math.min(mapHeight - r, simY));

        // Obstacles collision resolution
        for (const obs of currentObstacles) {
          if (obs.type === 'explosive_core' && (obs.health ?? 0) <= 0) continue;
          const closestX = Math.max(obs.x, Math.min(simX, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(simY, obs.y + obs.height));
          const distX = simX - closestX;
          const distY = simY - closestY;
          const dist = Math.hypot(distX, distY);
          if (dist < r) {
            if (dist > 0) {
              simX = closestX + (distX / dist) * r;
              simY = closestY + (distY / dist) * r;
            }
            if (obs.type === 'bumper') {
              simVx = -simVx * 1.5;
              simVy = -simVy * 1.5;
            }
          }
        }
      }

      // Check drift between current client prediction and authoritative replayed position
      const errX = simX - localPredictedPos.current.x;
      const errY = simY - localPredictedPos.current.y;
      const errDist = Math.hypot(errX, errY);

      if (errDist > 300) {
        // Catastrophic desync (teleport / arena wrap / respawn): snap position
        localPredictedPos.current.x = simX;
        localPredictedPos.current.y = simY;
        localPredictedPos.current.vx = simVx;
        localPredictedPos.current.vy = simVy;
        localVisualPos.current.x = simX;
        localVisualPos.current.y = simY;
        visualReconcileOffset.current = { x: 0, y: 0 };
      } else if (errDist > 0.05) {
        // Authoritative reconciliation: adopt server-authoritative simulation values
        localPredictedPos.current.x = simX;
        localPredictedPos.current.y = simY;
        localPredictedPos.current.vx = simVx;
        localPredictedPos.current.vy = simVy;

        // Counteract the sudden simulation step change in the visual offset,
        // so the visual rendering position does not snap at all upon receiving server corrections
        visualReconcileOffset.current.x -= errX;
        visualReconcileOffset.current.y -= errY;
      }
    },
    [mapWidth, mapHeight]
  );

  // Synchronous network tick subscription for 0ms latency reconciliation
  useEffect(() => {
    const unsub = networkManager.onTick((tick) => {
      // Intelligently merge incoming tick with existing player states to preserve names, colors, cosmetics, weapons
      const updated: Record<string, Partial<Player>> = { ...serverPlayersRef.current };
      for (const [id, p] of Object.entries(tick.players)) {
        updated[id] = {
          ...(updated[id] || {}),
          ...p,
        };
      }
      for (const id of Object.keys(updated)) {
        if (!tick.players[id]) {
          delete updated[id];
          remoteInterpolated.current.delete(id);
        }
      }
      serverPlayersRef.current = updated;

      if (tick.obstacles && tick.obstacles.length > 0) serverObstaclesRef.current = tick.obstacles;
      if (tick.powerUps) serverPowerUpsRef.current = tick.powerUps;
      if (tick.boss !== undefined) bossRef.current = tick.boss;
      localProjectiles.current = tick.projectiles.map((b) => ({ ...b }));

      const lp = updated[localPlayerId];
      if (lp) {
        reconcileLocalPlayer(lp, serverObstaclesRef.current);
      }

      // Refresh HUD at ~6 Hz or immediately on damage/death event
      const now = performance.now();
      const hasDamageEvent = lp && (lp.health !== prevHealth.current || lp.shield !== prevShield.current || lp.isDead !== prevDead.current);
      if (hasDamageEvent || now - lastHudUpdateTime.current >= 160) {
        lastHudUpdateTime.current = now;
        setHudTick((c) => c + 1);
      }
    });
    return () => {
      unsub();
    };
  }, [localPlayerId, reconcileLocalPlayer]);

  // Fallback reconciliation when props change
  useEffect(() => {
    if (localPlayer) {
      reconcileLocalPlayer(localPlayer, obstacles);
    }
  }, [localPlayer, obstacles, reconcileLocalPlayer]);

  // Detect touch device
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobileDevice(isTouch);
  }, []);

  // Audio feedback for local player damage & death
  useEffect(() => {
    if (!localPlayer) return;

    if (localPlayer.isDead && !prevDead.current) {
      soundManager.playExplosion();
      screenShake.current = 22;
    }

    if (localPlayer.shield !== undefined && prevShield.current > 0 && localPlayer.shield <= 0) {
      soundManager.playShieldBreak();
      screenShake.current = 12;
    } else if (localPlayer.health !== undefined && localPlayer.health < prevHealth.current) {
      soundManager.playHit();
      screenShake.current = 8;
    }

    prevDead.current = Boolean(localPlayer.isDead);
    prevShield.current = localPlayer.shield ?? 100;
    prevHealth.current = localPlayer.health ?? 100;
  }, [localPlayer]);

  // Particle creation helper with adaptive mobile performance scaling
  const spawnExplosionParticles = useCallback((x: number, y: number, color: string, count = 25) => {
    const quality = mobileSettingsRef.current.graphicsQuality;
    const maxCount = quality === 'low' ? 8 : quality === 'medium' ? 16 : 28;
    const actualCount = Math.min(count, maxCount);

    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 260;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 3 + Math.random() * 5,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.4,
      });
    }

    // Keep particles array bounded to prevent GC spikes and memory leakage on mobile devices
    if (particles.current.length > 140) {
      particles.current.splice(0, particles.current.length - 140);
    }
  }, []);

  // Spawn thruster trail particles based on cosmetic choice
  const spawnTrailParticle = useCallback((x: number, y: number, angle: number, trailType: string) => {
    const spread = (Math.random() - 0.5) * 0.5;
    const revAngle = angle + Math.PI + spread;
    const speed = 40 + Math.random() * 80;

    const style = getTrailParticleStyle(trailType);

    particles.current.push({
      x,
      y,
      vx: Math.cos(revAngle) * speed,
      vy: Math.sin(revAngle) * speed,
      color: style.color,
      alpha: 0.85,
      size: style.size,
      life: 0,
      maxLife: 0.25 + Math.random() * 0.2,
      type: style.type,
    });
  }, []);

  // Keyboard and mouse handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key) keysPressed.current[e.key.toLowerCase()] = true;
      if (e.code) keysPressed.current[e.code.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Shift' || e.code === 'Space') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key) keysPressed.current[e.key.toLowerCase()] = false;
      if (e.code) keysPressed.current[e.code.toLowerCase()] = false;
    };

    const handleBlur = () => {
      keysPressed.current = {};
      isMouseDown.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Input transmission loop (30Hz network packets)
  useEffect(() => {
    const inputInterval = setInterval(() => {
      const lp = localPlayerRef.current;
      if (!lp || lp.isDead) return;

      let moveX = 0;
      let moveY = 0;
      let angle = localPredictedPos.current.angle;
      let shooting =
        virtualFire.current ||
        virtualAim.current.isShooting ||
        isMouseDown.current ||
        Boolean(keysPressed.current[' '] || keysPressed.current['space']);
      let dashing =
        virtualDash.current ||
        Boolean(
          keysPressed.current['shift'] ||
          keysPressed.current['shiftleft'] ||
          keysPressed.current['shiftright']
        );
      virtualDash.current = false; // consume dash trigger

      // Virtual Joystick Input (Priority for mobile touch)
      if (virtualMove.current.x !== 0 || virtualMove.current.y !== 0) {
        moveX = virtualMove.current.x;
        moveY = virtualMove.current.y;
      } else {
        // Desktop keyboard inputs (English WASD + Russian layout ЦФЫВ + Arrows + KeyCode)
        const isUp =
          keysPressed.current['w'] ||
          keysPressed.current['keyw'] ||
          keysPressed.current['arrowup'] ||
          keysPressed.current['ц'];
        const isDown =
          keysPressed.current['s'] ||
          keysPressed.current['keys'] ||
          keysPressed.current['arrowdown'] ||
          keysPressed.current['ы'];
        const isLeft =
          keysPressed.current['a'] ||
          keysPressed.current['keya'] ||
          keysPressed.current['arrowleft'] ||
          keysPressed.current['ф'];
        const isRight =
          keysPressed.current['d'] ||
          keysPressed.current['keyd'] ||
          keysPressed.current['arrowright'] ||
          keysPressed.current['в'];

        if (isUp) moveY -= 1;
        if (isDown) moveY += 1;
        if (isLeft) moveX -= 1;
        if (isRight) moveX += 1;
      }

      // Aim direction: prioritize virtual aim joystick with fair Aim Assist
      if (virtualAim.current.angle !== null) {
        let rawAngle = virtualAim.current.angle;
        if (mobileSettingsRef.current.aimAssist !== 'off') {
          const enemies = Object.values(serverPlayersRef.current).filter(
            (p) => p && p.id !== localPlayerId && !p.isDead
          );
          rawAngle = calculateAimAssist(
            localPredictedPos.current.x,
            localPredictedPos.current.y,
            rawAngle,
            enemies,
            serverObstaclesRef.current,
            mobileSettingsRef.current.aimAssist
          );
        }
        angle = rawAngle;
      } else if (showTouchControls) {
        // MOBILE CONTROLS: When no aim stick is touched
        // 1. If shooting (FIRE button held or autoFire), lock aim onto nearest target (Boss or enemy)
        if (shooting) {
          let closestTargetAngle: number | null = null;
          let minTargetDist = 550;

          // Check Boss first if active
          if (bossRef.current && bossRef.current.health > 0) {
            const bdx = bossRef.current.x - localPredictedPos.current.x;
            const bdy = bossRef.current.y - localPredictedPos.current.y;
            const bdist = Math.hypot(bdx, bdy);
            if (bdist < minTargetDist) {
              closestTargetAngle = Math.atan2(bdy, bdx);
              minTargetDist = bdist;
            }
          }

          // Check Boss mini-NPC minions (shield guards, kamikazes, drones)
          if (bossRef.current && bossRef.current.minions) {
            for (const m of bossRef.current.minions) {
              if (m.health <= 0) continue;
              const mdx = m.x - localPredictedPos.current.x;
              const mdy = m.y - localPredictedPos.current.y;
              const mdist = Math.hypot(mdx, mdy);
              if (mdist < minTargetDist) {
                closestTargetAngle = Math.atan2(mdy, mdx);
                minTargetDist = mdist;
              }
            }
          }

          // Check visible enemy players
          const visibleEnemies = Object.values(serverPlayersRef.current).filter(
            (p) => p && p.id !== localPlayerId && !p.isDead && (!p.stealthRemaining || p.stealthRemaining <= 0)
          );
          for (const enemy of visibleEnemies) {
            if (enemy.x === undefined || enemy.y === undefined) continue;
            const edx = enemy.x - localPredictedPos.current.x;
            const edy = enemy.y - localPredictedPos.current.y;
            const edist = Math.hypot(edx, edy);
            if (edist < minTargetDist) {
              minTargetDist = edist;
              closestTargetAngle = Math.atan2(edy, edx);
            }
          }

          if (closestTargetAngle !== null) {
            angle = closestTargetAngle;
          } else if (moveX !== 0 || moveY !== 0) {
            angle = Math.atan2(moveY, moveX);
          } else {
            angle = localPredictedPos.current.angle ?? 0;
          }
        } else if (moveX !== 0 || moveY !== 0) {
          // Running without shooting: aim ship in movement direction
          angle = Math.atan2(moveY, moveX);
        } else {
          // Idle: keep current ship heading
          angle = localPredictedPos.current.angle ?? 0;
        }
      } else if (canvasRef.current) {
        // DESKTOP: Aim with mouse cursor
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const screenCenterX = rect.width / 2;
        const screenCenterY = rect.height / 2;
        const mouseRelX = mousePos.current.x - rect.left - screenCenterX;
        const mouseRelY = mousePos.current.y - rect.top - screenCenterY;
        angle = Math.atan2(mouseRelY, mouseRelX);
      }

      localPredictedPos.current.angle = angle;

      const inputPacket: PlayerInput = {
        moveX,
        moveY,
        angle,
        shooting,
        dashing,
        clientTime: performance.now(),
      };

      onSendInput(inputPacket);

      // Store input in pending buffer for authoritative server reconciliation
      pendingInputs.current.push({
        ...inputPacket,
        seq: inputPacket.seq ?? 0,
        dt: 1 / 60,
        time: performance.now(),
      });

      if (pendingInputs.current.length > 120) {
        pendingInputs.current.splice(0, pendingInputs.current.length - 120);
      }
    }, 1000 / 60);

    return () => clearInterval(inputInterval);
  }, [localPlayerId]);

  // Main High-DPI Smooth 60-144 FPS Render Loop with Local Prediction & Remote Interpolation
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      // High-precision smooth frame delta interpolation (optimized for 60-120Hz displays)
      const dt = Math.max(0.001, Math.min(0.05, (time - lastTime) / 1000));
      lastTime = time;

      // Track FPS
      frameCount.current++;
      if (time - lastFpsCheck.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsCheck.current = time;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Resize canvas to match display size with optimal DPR for mobile and desktop hardware
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || (window.innerHeight - 56);
      const isBoost = fpsBoostRef.current;
      const quality = mobileSettingsRef.current.graphicsQuality;

      // Adaptive DPR scaling: low=1.0 for budget phones, med=1.25, high=up to 1.5
      const dpr = isBoost || quality === 'low'
        ? 1.0
        : quality === 'medium'
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 1, 1.5);

      const targetW = Math.floor(width * dpr);
      const targetH = Math.floor(height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save(); // [SAVE 1: DPR Scale]
      ctx.scale(dpr, dpr);

      try {
        const localPlayer = serverPlayersRef.current[localPlayerId];
      const activeMap = mapRef.current || map || {
        id: 'neon_grid',
        name: 'Cyber Neon Grid',
        theme: 'cyan',
        width: 2400,
        height: 1600,
        description: 'Default Arena',
        gameplayFeature: 'Balanced',
        obstacles: [],
        spawnPoints: [{ x: 500, y: 500 }, { x: 1900, y: 1100 }],
      };
      const activeMapWidth = activeMap?.width || mapWidth || 2400;
      const activeMapHeight = activeMap?.height || mapHeight || 1600;
      const activeLang = langRef.current;
      const useGlow = !isBoost && quality === 'high'; // Disable raster blur on low/med for 60-120 FPS

      // 1. CLIENT-SIDE LOCAL PREDICTION (ZERO INPUT LAG!)
      if (localPlayer && !localPlayer.isDead) {
        let inputX = 0;
        let inputY = 0;
        if (virtualMove.current.x !== 0 || virtualMove.current.y !== 0) {
          inputX = virtualMove.current.x;
          inputY = virtualMove.current.y;
        } else {
          const isUp =
            keysPressed.current['w'] ||
            keysPressed.current['keyw'] ||
            keysPressed.current['arrowup'] ||
            keysPressed.current['ц'];
          const isDown =
            keysPressed.current['s'] ||
            keysPressed.current['keys'] ||
            keysPressed.current['arrowdown'] ||
            keysPressed.current['ы'];
          const isLeft =
            keysPressed.current['a'] ||
            keysPressed.current['keya'] ||
            keysPressed.current['arrowleft'] ||
            keysPressed.current['ф'];
          const isRight =
            keysPressed.current['d'] ||
            keysPressed.current['keyd'] ||
            keysPressed.current['arrowright'] ||
            keysPressed.current['в'];

          if (isUp) inputY -= 1;
          if (isDown) inputY += 1;
          if (isLeft) inputX -= 1;
          if (isRight) inputX += 1;
        }

        const mag = Math.hypot(inputX, inputY);
        const normX = mag > 0 ? inputX / mag : 0;
        const normY = mag > 0 ? inputY / mag : 0;
        const speed = GAME_CONSTANTS.BASE_SPEED * (localPlayer.speedMultiplier || 1.0);

        let deltaX = 0;
        let deltaY = 0;

        if (localPlayer.isDashing) {
          // Dash impulse
          deltaX = localPredictedPos.current.vx * dt;
          deltaY = localPredictedPos.current.vy * dt;
        } else if (mag > 0) {
          localPredictedPos.current.vx = normX * speed;
          localPredictedPos.current.vy = normY * speed;
          deltaX = localPredictedPos.current.vx * dt;
          deltaY = localPredictedPos.current.vy * dt;

          // Spawn engine trail particles
          const trail = localPlayer.cosmetics?.trail || 'default';
          spawnTrailParticle(localPredictedPos.current.x, localPredictedPos.current.y, localPredictedPos.current.angle, trail);
        } else {
          localPredictedPos.current.vx *= 0.85;
          localPredictedPos.current.vy *= 0.85;
          deltaX = localPredictedPos.current.vx * dt;
          deltaY = localPredictedPos.current.vy * dt;
        }

        localPredictedPos.current.x += deltaX;
        localPredictedPos.current.y += deltaY;

        // Clamp to map boundaries
        const r = GAME_CONSTANTS.PLAYER_RADIUS;
        localPredictedPos.current.x = Math.max(r, Math.min(activeMapWidth - r, localPredictedPos.current.x));
        localPredictedPos.current.y = Math.max(r, Math.min(activeMapHeight - r, localPredictedPos.current.y));

        // Obstacle collisions on predicted position
        const currentObstacles = serverObstaclesRef.current.length > 0 ? serverObstaclesRef.current : obstacles;
        for (const obs of currentObstacles) {
          if (obs.type === 'explosive_core' && (obs.health ?? 0) <= 0) continue;
          const closestX = Math.max(obs.x, Math.min(localPredictedPos.current.x, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(localPredictedPos.current.y, obs.y + obs.height));
          const distX = localPredictedPos.current.x - closestX;
          const distY = localPredictedPos.current.y - closestY;
          const dist = Math.hypot(distX, distY);
          if (dist < r) {
            if (dist > 0) {
              localPredictedPos.current.x = closestX + (distX / dist) * r;
              localPredictedPos.current.y = closestY + (distY / dist) * r;
            }
            if (obs.type === 'bumper') {
              localPredictedPos.current.vx = -localPredictedPos.current.vx * 1.5;
              localPredictedPos.current.vy = -localPredictedPos.current.vy * 1.5;
            }
          }
        }
      }

      // Smooth local player's visual position using linear interpolation (lerp)
      // Eliminates snapping, camera hitching, and jitter during reconciliation
      smoothLocalVisualPosition(dt);
      const localRenderX = localVisualPos.current.x;
      const localRenderY = localVisualPos.current.y;

      // 2. REMOTE ENTITY INTERPOLATION (SMOOTH GLIDE WITH VELOCITY EXTRAPOLATION)
      const currentPlayers = serverPlayersRef.current;
      for (const [id, p] of Object.entries(currentPlayers)) {
        if (!p || id === localPlayerId || p.x === undefined || p.y === undefined) continue;

        let interp = remoteInterpolated.current.get(id);
        if (!interp) {
          interp = {
            x: p.x,
            y: p.y,
            vx: p.vx || 0,
            vy: p.vy || 0,
            angle: p.angle || 0,
            targetX: p.x,
            targetY: p.y,
            targetVx: p.vx || 0,
            targetVy: p.vy || 0,
            targetAngle: p.angle || 0,
          };
          remoteInterpolated.current.set(id, interp);
        }

        // Check if server position jumped (respawn / teleport / dead)
        const distToServer = Math.hypot(p.x - interp.x, p.y - interp.y);
        if (distToServer > 140 || p.isDead) {
          interp.x = p.x;
          interp.y = p.y;
          interp.targetX = p.x;
          interp.targetY = p.y;
          interp.vx = p.vx || 0;
          interp.vy = p.vy || 0;
          interp.targetVx = p.vx || 0;
          interp.targetVy = p.vy || 0;
          interp.angle = p.angle || 0;
          interp.targetAngle = p.angle || 0;
        } else {
          interp.targetX = p.x;
          interp.targetY = p.y;
          interp.targetVx = p.vx || 0;
          interp.targetVy = p.vy || 0;
          interp.targetAngle = p.angle || 0;
        }

        // Continuous velocity extrapolation between network ticks (dead-reckoning)
        interp.x += interp.vx * dt;
        interp.y += interp.vy * dt;

        // Smoothly steer towards authoritative server state
        const lerpFactor = Math.min(1, dt * 18);
        interp.x += (interp.targetX - interp.x) * lerpFactor;
        interp.y += (interp.targetY - interp.y) * lerpFactor;
        interp.vx += (interp.targetVx - interp.vx) * lerpFactor;
        interp.vy += (interp.targetVy - interp.vy) * lerpFactor;

        // Shortest-distance angular interpolation
        let angleDiff = interp.targetAngle - interp.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        interp.angle += angleDiff * Math.min(1, dt * 20);

        // Spawn trails for moving remote ships
        if (Math.hypot(interp.vx, interp.vy) > 15 && !p.isDead) {
          spawnTrailParticle(interp.x, interp.y, interp.angle, p.cosmetics?.trail || 'default');
        }
      }

      // Cleanup departed players
      for (const id of remoteInterpolated.current.keys()) {
        if (!currentPlayers[id] || id === localPlayerId) {
          remoteInterpolated.current.delete(id);
        }
      }

      // 3. CONTINUOUS PROJECTILE FLIGHT
      for (const b of localProjectiles.current) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // 4. CAMERA SMOOTH TRACKING
      if (screenShake.current > 0) {
        screenShake.current = Math.max(0, screenShake.current - dt * 45);
      }
      const shakeX = (Math.random() - 0.5) * screenShake.current;
      const shakeY = (Math.random() - 0.5) * screenShake.current;

      const targetCamX = localRenderX - width / 2;
      const targetCamY = localRenderY - height / 2;
      const camSmooth = Math.min(1, dt * 22);
      camera.current.x += (targetCamX - camera.current.x) * camSmooth;
      camera.current.y += (targetCamY - camera.current.y) * camSmooth;

      // Clear Canvas Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      ctx.save(); // [SAVE 2: Camera Translation]
      try {
        ctx.translate(-camera.current.x + shakeX, -camera.current.y + shakeY);

      // Draw Arena Outer Boundaries
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      if (useGlow) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 18;
      }
      ctx.strokeRect(0, 0, activeMapWidth, activeMapHeight);
      if (useGlow) ctx.shadowBlur = 0;

      // Draw Cyber Grid Lines
      const gridSize = 64;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const startX = Math.max(0, Math.floor(camera.current.x / gridSize) * gridSize);
      const endX = Math.min(activeMapWidth, camera.current.x + width + gridSize);
      const startY = Math.max(0, Math.floor(camera.current.y / gridSize) * gridSize);
      const endY = Math.min(activeMapHeight, camera.current.y + height + gridSize);

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, activeMapHeight);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(activeMapWidth, y);
      }
      ctx.stroke();

      // 5. Draw Obstacles
      const currentObstaclesList = serverObstaclesRef.current.length > 0 ? serverObstaclesRef.current : obstacles;
      for (const obs of currentObstaclesList) {
        if (obs.type === 'barrier') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          if (useGlow) {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
          }
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          if (useGlow) ctx.shadowBlur = 0;

          // Diagonal warning stripes
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.stroke();
        } else if (obs.type === 'bumper') {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          if (useGlow) {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
          }
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          if (useGlow) ctx.shadowBlur = 0;

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 12, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'explosive_core') {
          if ((obs.health ?? 1) > 0) {
            const pulse = (Math.sin(time * 0.008) + 1) / 2;
            ctx.fillStyle = `rgba(225, 29, 72, ${0.4 + pulse * 0.4})`;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            if (useGlow) {
              ctx.shadowColor = '#f43f5e';
              ctx.shadowBlur = 15;
            }
            ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            if (useGlow) ctx.shadowBlur = 0;

            const maxHp = obs.maxHealth || 60;
            const curHp = obs.health || 0;
            const pct = Math.max(0, curHp / maxHp);
            ctx.fillStyle = '#e11d48';
            ctx.fillRect(obs.x, obs.y - 8, obs.width * pct, 4);
          }
        }
      }

      // 6. Draw Power-ups
      const currentPowerUpsList = serverPowerUpsRef.current.length > 0 ? serverPowerUpsRef.current : powerUps;
      for (const pu of currentPowerUpsList) {
        ctx.save();
        ctx.translate(pu.x, pu.y);

        const glowPulse = 1 + Math.sin(time * 0.006) * 0.2;
        let color = '#38bdf8';
        let label = 'MOD';
        let textSub = '';

        if (pu.type === 'health') {
          color = '#10b981';
          label = '+';
          textSub = 'HULL';
        } else if (pu.type === 'shield') {
          color = '#06b6d4';
          label = '🛡️';
          textSub = 'SHIELD';
        } else if (pu.type === 'spread') {
          color = '#ec4899';
          label = '3X';
          textSub = 'SPREAD';
        } else if (pu.type === 'railgun') {
          color = '#3b82f6';
          label = '⚡';
          textSub = 'RAILGUN';
        } else if (pu.type === 'burst_cannon') {
          color = '#f59e0b';
          label = '💥';
          textSub = 'BURST';
        } else if (pu.type === 'missile_launcher') {
          color = '#ef4444';
          label = '🚀';
          textSub = 'ROCKET';
        } else if (pu.type === 'laser_beam') {
          color = '#10b981';
          label = '━';
          textSub = 'LASER';
        } else if (pu.type === 'plasma_shotgun') {
          color = '#8b5cf6';
          label = '∴';
          textSub = 'SHOTGUN';
        } else if (pu.type === 'emp_cannon') {
          color = '#06b6d4';
          label = '📡';
          textSub = 'EMP';
        } else if (pu.type === 'mine_launcher') {
          color = '#e11d48';
          label = '💣';
          textSub = 'MINES';
        } else if (pu.type === 'ricochet_cannon') {
          color = '#a855f7';
          label = '🔄';
          textSub = 'RICOCHET';
        } else if (pu.type === 'charge_beam') {
          color = '#38bdf8';
          label = '⚡';
          textSub = 'CHARGE';
        } else if (pu.type === 'speed') {
          color = '#f59e0b';
          label = '⚡';
          textSub = 'SPEED';
        } else if (pu.type === 'quad_damage') {
          color = '#c026d3';
          label = '4X';
          textSub = 'QUAD DMG';
        } else if (pu.type === 'homing_missile') {
          color = '#e11d48';
          label = '🎯';
          textSub = 'HOMING';
        } else if (pu.type === 'stealth_cloak') {
          color = '#8b5cf6';
          label = '👁️';
          textSub = 'STEALTH';
        } else if (pu.type === 'emp_shockwave') {
          color = '#0284c7';
          label = '⚡';
          textSub = 'EMP WAVE';
        } else if (pu.type === 'legendary_matrix') {
          color = '#eab308';
          label = '👑';
          textSub = 'MATRIX';
        } else if (pu.type === 'mod_homing') {
          color = '#38bdf8';
          label = '🎯';
          textSub = 'HOMING';
        } else if (pu.type === 'mod_piercing') {
          color = '#f59e0b';
          label = '⚡';
          textSub = 'PIERCE';
        } else if (pu.type === 'mod_split') {
          color = '#ec4899';
          label = '💥';
          textSub = 'SPLIT';
        } else if (pu.type === 'mod_explosive') {
          color = '#ef4444';
          label = '💣';
          textSub = 'EXPLOSIVE';
        } else if (pu.type === 'mod_ricochet') {
          color = '#8b5cf6';
          label = '🔄';
          textSub = 'RICOCHET';
        } else if (pu.type === 'mod_rapid_fire') {
          color = '#10b981';
          label = '⚡';
          textSub = 'RAPID FIRE';
        } else if (pu.type === 'mod_overcharge') {
          color = '#f97316';
          label = '🔋';
          textSub = 'OVERCHARGE';
        } else if (pu.type === 'mod_shield_breaker') {
          color = '#06b6d4';
          label = '🛡️';
          textSub = 'SHIELD BRK';
        } else if (pu.type === 'mod_armor_piercer') {
          color = '#e11d48';
          label = '🗡️';
          textSub = 'ARMOR PRC';
        } else if (pu.type === 'mod_emp') {
          color = '#0ea5e9';
          label = '📡';
          textSub = 'EMP MOD';
        } else if (pu.type === 'mod_burn') {
          color = '#f43f5e';
          label = '🔥';
          textSub = 'BURN';
        } else if (pu.type === 'mod_freeze') {
          color = '#a5f3fc';
          label = '❄️';
          textSub = 'FREEZE';
        } else if (pu.type === 'mod_gravity') {
          color = '#c084fc';
          label = '🌀';
          textSub = 'GRAVITY';
        } else if (pu.type === 'mod_chain') {
          color = '#fbbf24';
          label = '⚡';
          textSub = 'CHAIN';
        }

        if (useGlow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 14 * glowPulse;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;

        ctx.rotate((time * 0.002) % (Math.PI * 2));
        ctx.strokeRect(-pu.radius, -pu.radius, pu.radius * 2, pu.radius * 2);

        if (useGlow) ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);

        if (textSub) {
          ctx.font = 'bold 7.5px Orbitron, sans-serif';
          ctx.fillStyle = color;
          ctx.fillText(textSub, 0, pu.radius + 9);
        }

        ctx.restore();
      }

      // 7. Draw Projectiles
      for (const b of localProjectiles.current) {
        ctx.save();
        if (useGlow) {
          ctx.shadowColor = b.color;
          ctx.shadowBlur = b.homing ? 14 : 10;
        }
        ctx.fillStyle = b.color;

        if (b.weaponType === 'railgun') {
          const angle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(angle);
          // Luminous piercing wake trail
          ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.fillRect(-38, -b.radius * 0.4, 38, b.radius * 0.8);
          // Main hyper-velocity slug
          ctx.fillStyle = b.color;
          ctx.fillRect(-18, -b.radius * 0.6, 36, b.radius * 1.2);
          // White-hot plasma core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-10, -b.radius * 0.25, 24, b.radius * 0.5);
        } else if (b.weaponType === 'laser_beam') {
          const angle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(angle);
          ctx.fillStyle = b.color;
          ctx.fillRect(-24, -b.radius * 0.6, 48, b.radius * 1.2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-16, -b.radius * 0.3, 32, b.radius * 0.6);
        } else if (b.weaponType === 'missile_launcher') {
          const angle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(angle);
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.moveTo(b.radius + 3, 0);
          ctx.lineTo(-b.radius, -b.radius * 0.7);
          ctx.lineTo(-b.radius * 0.6, 0);
          ctx.lineTo(-b.radius, b.radius * 0.7);
          ctx.closePath();
          ctx.fill();
          // Thruster engine glow
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(-b.radius - 2, 0, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.weaponType === 'mine_launcher') {
          ctx.translate(b.x, b.y);
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          // Proximity beacon blink
          const isBlink = Math.sin(time * 0.015) > 0;
          ctx.fillStyle = isBlink ? '#ffffff' : '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.weaponType === 'charge_beam') {
          const angle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(angle);
          ctx.fillStyle = b.color;
          ctx.fillRect(-28, -b.radius, 56, b.radius * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-20, -b.radius * 0.5, 40, b.radius);
        } else {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x - (b.vx / 120), b.y - (b.vy / 120), b.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Update & Draw Particles
      const remainingParticles: Particle[] = [];
      for (const p of particles.current) {
        p.life += dt;
        if (p.life < p.maxLife) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha = 1 - p.life / p.maxLife;

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;

          if (p.type === 'star') {
            ctx.translate(p.x, p.y);
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.3, -p.size * 0.3);
            ctx.lineTo(p.size, 0);
            ctx.lineTo(p.size * 0.3, p.size * 0.3);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size * 0.3, p.size * 0.3);
            ctx.lineTo(-p.size, 0);
            ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.size * (1 - p.life / p.maxLife)), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          remainingParticles.push(p);
        }
      }
      particles.current = remainingParticles;

      // 9. Draw Players (Ships, Hats, Titles, Vitals)
      const renderPlayers = serverPlayersRef.current;
      for (const [id, p] of Object.entries(renderPlayers)) {
        if (!p) continue;

        const isLocal = id === localPlayerId;
        let px = 0;
        let py = 0;
        let pAngle = 0;

        if (isLocal) {
          px = localRenderX;
          py = localRenderY;
          pAngle = localPredictedPos.current.angle;
        } else {
          const interp = remoteInterpolated.current.get(id);
          px = interp ? interp.x : (p.x || 0);
          py = interp ? interp.y : (p.y || 0);
          pAngle = interp ? interp.angle : (p.angle || 0);
        }

        if (p.isDead) {
          ctx.save();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.arc(px, py, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        ctx.save();
        ctx.translate(px, py);

        // Stealth cloak effect: render translucent
        const isStealthed = Boolean(p.stealthRemaining && p.stealthRemaining > 0);
        if (isStealthed) {
          ctx.globalAlpha = isLocal ? 0.45 : 0.18;
        }

        // Quad Damage Glowing Aura
        if (p.quadDamageRemaining && p.quadDamageRemaining > 0) {
          ctx.strokeStyle = 'rgba(192, 38, 211, 0.8)';
          ctx.lineWidth = 3;
          if (useGlow) {
            ctx.shadowColor = '#c026d3';
            ctx.shadowBlur = 15;
          }
          ctx.beginPath();
          ctx.arc(0, 0, GAME_CONSTANTS.PLAYER_RADIUS + 10, 0, Math.PI * 2);
          ctx.stroke();
          if (useGlow) ctx.shadowBlur = 0;
        }

        // Invulnerability Shield Ring
        const now = Date.now();
        if (p.invulnerableUntil && now < p.invulnerableUntil) {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, GAME_CONSTANTS.PLAYER_RADIUS + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Energy Shield Gauge Ring
        if ((p.shield ?? 0) > 0) {
          const shieldPct = (p.shield || 0) / GAME_CONSTANTS.MAX_SHIELD;
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 + shieldPct * 0.6})`;
          ctx.lineWidth = 3;
          if (useGlow) {
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
          }
          ctx.beginPath();
          ctx.arc(0, 0, GAME_CONSTANTS.PLAYER_RADIUS + 3, 0, Math.PI * 2 * shieldPct);
          ctx.stroke();
          if (useGlow) ctx.shadowBlur = 0;
        }

        // Dash Glow Box
        if (p.isDashing) {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 4;
          if (useGlow) {
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 14;
          }
          ctx.strokeRect(-22, -22, 44, 44);
          if (useGlow) ctx.shadowBlur = 0;
        }

        // Rotate for ship heading
        ctx.rotate(pAngle);

        const shipColor = p.color || '#06b6d4';
        const cosmetics = p.cosmetics || { shipModel: 'phantom', hat: 'none', trail: 'default', title: 'rookie' };

        // DRAW CUSTOM PROCEDURAL SHIP HULL SILHOUETTE (ALL 25 SHIPS)
        drawProceduralShipHull(ctx, cosmetics.shipModel as ShipModelType, shipColor, useGlow);

        // DRAW HATS & HEADGEAR (18+ HATS)
        drawShipHats(ctx, cosmetics.hat as HatType, useGlow);

        // DRAW ACCESSORIES (WINGS, ROTATING DRONES, AURAS, TAILS, GENERATORS)
        drawShipAccessories(
          ctx,
          cosmetics.accessory as AccessoryType,
          shipColor,
          Boolean(p.isDashing),
          performance.now(),
          useGlow
        );

        ctx.restore(); // Restore player rotation

        // 10. Title, Nameplate & Health Gauge
        ctx.save();
        ctx.translate(px, py);

        // Title Badge
        if (cosmetics.title && cosmetics.title !== 'rookie') {
          let titleText = '';
          if (cosmetics.title === 'sniper') titleText = activeLang === 'ru' ? '🎯 СНАЙПЕР' : '🎯 SNIPER';
          else if (cosmetics.title === 'slayer') titleText = activeLang === 'ru' ? '⚔️ ГРОЗА АРЕНЫ' : '⚔️ SLAYER';
          else if (cosmetics.title === 'untouchable') titleText = activeLang === 'ru' ? '🛡️ НЕУЯЗВИМЫЙ' : '🛡️ UNTOUCHABLE';
          else if (cosmetics.title === 'legend') titleText = activeLang === 'ru' ? '★ ЛЕГЕНДА ★' : '★ LEGEND ★';
          else if (cosmetics.title === 'titan_slayer') titleText = activeLang === 'ru' ? '👹 ТИТАН-КИЛЛЕР' : '👹 TITAN SLAYER';
          else if (cosmetics.title === 'warlord') titleText = activeLang === 'ru' ? '🛡️ ВАРЛОРД' : '🛡️ WARLORD';
          else if (cosmetics.title === 'void_walker') titleText = activeLang === 'ru' ? '🌌 СТРАННИК ПУСТОТЫ' : '🌌 VOID WALKER';
          else if (cosmetics.title === 'cyber_god') titleText = activeLang === 'ru' ? '⚡ КИБЕР-БОГ' : '⚡ CYBER GOD';
          else if (cosmetics.title === 'apex_predator') titleText = activeLang === 'ru' ? '🐺 АПЕКС ХИЩНИК' : '🐺 APEX PREDATOR';
          else if (cosmetics.title === 'phantom_ghost') titleText = activeLang === 'ru' ? '👻 ПРИЗРАК' : '👻 GHOST';

          ctx.font = 'bold 9px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = (cosmetics.title === 'legend' || cosmetics.title === 'cyber_god') ? '#f59e0b' : '#38bdf8';
          ctx.fillText(titleText, 0, -GAME_CONSTANTS.PLAYER_RADIUS - 24);
        }

        // Player Name
        ctx.font = 'bold 11px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isLocal ? '#38bdf8' : '#e2e8f0';
        ctx.fillText(p.name || 'Pilot', 0, -GAME_CONSTANTS.PLAYER_RADIUS - 12);

        // Health Bar
        const barW = 42;
        const barH = 4;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-barW / 2, -GAME_CONSTANTS.PLAYER_RADIUS - 7, barW, barH);

        const hpPct = Math.max(0, (p.health || 0) / GAME_CONSTANTS.MAX_HEALTH);
        ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(-barW / 2, -GAME_CONSTANTS.PLAYER_RADIUS - 7, barW * hpPct, barH);

        ctx.restore();
      }

      // Render Boss in Boss Raid Mode
      const currentBoss = bossRef.current;
      if (currentBoss && currentBoss.health > 0) {
        const renderTime = performance.now();
        ctx.save();
        ctx.translate(currentBoss.x, currentBoss.y);

        // Pulsing Dark Matter / Void Aura
        const auraPulse = 8 + Math.sin(renderTime * 0.005) * 5;
        ctx.strokeStyle = currentBoss.isEnraged
          ? 'rgba(244, 63, 94, 0.8)'
          : currentBoss.phase === 2
          ? 'rgba(168, 85, 247, 0.8)'
          : 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 4;
        if (useGlow) {
          ctx.shadowColor = currentBoss.isEnraged ? '#f43f5e' : '#a855f7';
          ctx.shadowBlur = 25;
        }
        ctx.beginPath();
        ctx.arc(0, 0, currentBoss.radius + auraPulse, 0, Math.PI * 2);
        ctx.stroke();
        if (useGlow) ctx.shadowBlur = 0;

        // Energy Shield Ring
        if (currentBoss.shield > 0) {
          const shieldRatio = currentBoss.shield / currentBoss.maxShield;
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(0, 0, currentBoss.radius + 18, 0, Math.PI * 2 * shieldRatio);
          ctx.stroke();
        }

        // Rotate for ship model orientation
        ctx.rotate(currentBoss.angle);

        // Giant Dreadnought Armor Body
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = currentBoss.isEnraged ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(currentBoss.radius, 0);
        ctx.lineTo(currentBoss.radius * 0.4, currentBoss.radius * 0.7);
        ctx.lineTo(-currentBoss.radius * 0.6, currentBoss.radius * 0.95);
        ctx.lineTo(-currentBoss.radius * 0.85, currentBoss.radius * 0.4);
        ctx.lineTo(-currentBoss.radius * 0.7, 0);
        ctx.lineTo(-currentBoss.radius * 0.85, -currentBoss.radius * 0.4);
        ctx.lineTo(-currentBoss.radius * 0.6, -currentBoss.radius * 0.95);
        ctx.lineTo(currentBoss.radius * 0.4, -currentBoss.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner armor plating
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(currentBoss.radius * 0.6, 0);
        ctx.lineTo(0, currentBoss.radius * 0.45);
        ctx.lineTo(-currentBoss.radius * 0.5, currentBoss.radius * 0.3);
        ctx.lineTo(-currentBoss.radius * 0.4, 0);
        ctx.lineTo(-currentBoss.radius * 0.5, -currentBoss.radius * 0.3);
        ctx.lineTo(0, -currentBoss.radius * 0.45);
        ctx.closePath();
        ctx.fill();

        // 4 Heavy Plasma Turret Pods
        ctx.fillStyle = currentBoss.isEnraged ? '#f43f5e' : '#06b6d4';
        for (const [tx, ty] of [
          [currentBoss.radius * 0.3, currentBoss.radius * 0.5],
          [currentBoss.radius * 0.3, -currentBoss.radius * 0.5],
          [-currentBoss.radius * 0.3, currentBoss.radius * 0.6],
          [-currentBoss.radius * 0.3, -currentBoss.radius * 0.6],
        ]) {
          ctx.beginPath();
          ctx.arc(tx, ty, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pulsing Void Core Reactor
        const coreSize = 18 + Math.sin(renderTime * 0.008) * 4;
        ctx.fillStyle = currentBoss.isEnraged ? '#f43f5e' : '#ec4899';
        if (useGlow) {
          ctx.shadowColor = currentBoss.isEnraged ? '#f43f5e' : '#ec4899';
          ctx.shadowBlur = 20;
        }
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();
        if (useGlow) ctx.shadowBlur = 0;

        ctx.restore();

        // In-World Boss Title & Health Bar (Overhead)
        ctx.save();
        ctx.translate(currentBoss.x, currentBoss.y);

        ctx.font = 'bold 14px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = currentBoss.isEnraged ? '#f43f5e' : '#38bdf8';
        ctx.fillText(
          `${currentBoss.name} [${currentBoss.attackName || 'АТАКА'}]`,
          0,
          -currentBoss.radius - 28
        );

        // In-world bar
        const bw = 180;
        const bh = 8;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(-bw / 2, -currentBoss.radius - 20, bw, bh);

        const bhpPct = Math.max(0, currentBoss.health / currentBoss.maxHealth);
        ctx.fillStyle = currentBoss.isEnraged ? '#f43f5e' : '#10b981';
        ctx.fillRect(-bw / 2, -currentBoss.radius - 20, bw * bhpPct, bh);

        if (currentBoss.shield > 0) {
          const bshPct = Math.max(0, currentBoss.shield / currentBoss.maxShield);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(-bw / 2, -currentBoss.radius - 22, bw * bshPct, 2);
        }

        ctx.restore();

        // 11b. Render Mini-NPC Minions of the Void Titan
        if (currentBoss.minions && currentBoss.minions.length > 0) {
          for (const minion of currentBoss.minions) {
            if (minion.health <= 0) continue;

            // If Shield Guard, draw energetic energy tether beam powering the Void Titan
            if (minion.type === 'shield_guard') {
              ctx.save();
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
              ctx.lineWidth = 2;
              ctx.setLineDash([8, 8]);
              ctx.lineDashOffset = -performance.now() * 0.05;
              ctx.beginPath();
              ctx.moveTo(minion.x, minion.y);
              ctx.lineTo(currentBoss.x, currentBoss.y);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.restore();
            }

            ctx.save();
            ctx.translate(minion.x, minion.y);
            ctx.rotate(minion.angle);

            // Minion hull
            if (minion.type === 'kamikaze') {
              // Rapid blinking red strobe + trailing flame
              const strobe = Math.sin(performance.now() * 0.025) > 0;
              ctx.fillStyle = strobe ? '#ef4444' : '#f43f5e';
              ctx.beginPath();
              ctx.moveTo(minion.radius + 5, 0);
              ctx.lineTo(-minion.radius, -minion.radius * 0.8);
              ctx.lineTo(-minion.radius * 0.4, 0);
              ctx.lineTo(-minion.radius, minion.radius * 0.8);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#fbcfe8';
              ctx.lineWidth = 1.8;
              ctx.stroke();

              // Thruster flame
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.moveTo(-minion.radius * 0.4, 0);
              ctx.lineTo(-minion.radius - 7, -3);
              ctx.lineTo(-minion.radius - 7, 3);
              ctx.closePath();
              ctx.fill();
            } else if (minion.type === 'shield_guard') {
              // Hexagonal armored shield core with rotating barrier arc
              ctx.fillStyle = '#0284c7';
              ctx.beginPath();
              ctx.arc(0, 0, minion.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2.5;
              ctx.stroke();

              // Rotating outer shield arc
              const guardAngle = (performance.now() * 0.003) % (Math.PI * 2);
              ctx.strokeStyle = '#67e8f9';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, minion.radius + 5, guardAngle, guardAngle + Math.PI);
              ctx.stroke();
            } else {
              // Drone: sharp twin blaster nozzles & laser guide
              ctx.fillStyle = '#7c3aed';
              ctx.beginPath();
              ctx.moveTo(minion.radius + 2, 0);
              ctx.lineTo(-minion.radius * 0.6, -minion.radius * 0.7);
              ctx.lineTo(-minion.radius * 0.3, 0);
              ctx.lineTo(-minion.radius * 0.6, minion.radius * 0.7);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#c084fc';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Twin blaster barrels
              ctx.fillStyle = '#e9d5ff';
              ctx.fillRect(minion.radius - 1, -5, 5, 2);
              ctx.fillRect(minion.radius - 1, 3, 5, 2);
            }

            // Minion health bar
            ctx.restore();
            ctx.save();
            ctx.translate(minion.x, minion.y);
            const mHpPct = Math.max(0, minion.health / minion.maxHealth);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(-12, -minion.radius - 8, 24, 3);
            ctx.fillStyle = minion.type === 'kamikaze' ? '#f43f5e' : minion.type === 'shield_guard' ? '#38bdf8' : '#a855f7';
            ctx.fillRect(-12, -minion.radius - 8, 24 * mHpPct, 3);
            ctx.restore();
          }
        }
      }
        } finally {
          ctx.restore(); // [RESTORE 2: camera translation]
        }
      } finally {
        ctx.restore(); // [RESTORE 1: DPR scale - 100% leak-proof!]
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [localPlayerId, smoothLocalVisualPosition, spawnTrailParticle]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const relX = touch.clientX - rect.left;
      const relY = touch.clientY - rect.top;

      if (relX < rect.width / 2 && touchMoveIdentifier.current === null) {
        touchMoveIdentifier.current = touch.identifier;
        touchMoveStart.current = { x: relX, y: relY };
        touchMoveCurrent.current = { x: relX, y: relY };
      } else if (relX >= rect.width / 2 && touchAimIdentifier.current === null) {
        touchAimIdentifier.current = touch.identifier;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const angle = Math.atan2(relY - centerY, relX - centerX);
        touchAimCurrent.current = { angle, shooting: true };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const relX = touch.clientX - rect.left;
      const relY = touch.clientY - rect.top;

      if (touch.identifier === touchMoveIdentifier.current) {
        touchMoveCurrent.current = { x: relX, y: relY };
      } else if (touch.identifier === touchAimIdentifier.current) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const angle = Math.atan2(relY - centerY, relX - centerX);
        touchAimCurrent.current = { angle, shooting: true };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchMoveIdentifier.current) {
        touchMoveIdentifier.current = null;
        touchMoveStart.current = null;
        touchMoveCurrent.current = null;
      } else if (touch.identifier === touchAimIdentifier.current) {
        touchAimIdentifier.current = null;
        touchAimCurrent.current = { angle: localPredictedPos.current.angle, shooting: false };
      }
    }
  };

  const handleTriggerMobileDash = useCallback(() => {
    if (!localPlayer || (localPlayer.dashCooldown ?? 0) > 0) return;
    virtualDash.current = true;
    soundManager.playDash();
  }, [localPlayer]);

  const handleCycleWeapon = useCallback(() => {
    // Secondary ability / quick cycle weapon if in practice or lobby
    soundManager.playPickup();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const topPlayers = Object.entries(serverPlayersRef.current)
    .filter(([_, p]) => Boolean(p && (p.name || p.id)))
    .map(([id, p]) => ({ ...p, id: p.id || id, name: p.name || 'Pilot' }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  const isSmallScreen = isMobile || screenWidth < 680 || screenHeight < 500;
  const showTouchControls = isTouch || isMobile || isTablet;
  const activeBoss = bossRef.current || boss;

  return (
    <div
      className="relative w-full h-full md:h-[calc(100vh-56px)] max-md:h-[100dvh] overflow-hidden bg-slate-950 select-none gameplay-touch-area"
      style={{ touchAction: 'none' }}
    >
      {/* Game Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* PORTRAIT ORIENTATION WARNING FOR MOBILE & TABLETS */}
      {isPortrait && (isMobile || isTablet) && !portraitDismissed && (
        <OrientationWarning lang={lang} onDismiss={dismissPortraitWarning} />
      )}

      {/* RESPONSIVE TOP HUD */}
      {!isSmallScreen ? (
        /* TABLET & DESKTOP FULL TOP HUD */
        <div className="absolute top-2 inset-x-3 sm:inset-x-4 flex items-start justify-between pointer-events-none z-40 safe-pt">
          {/* Left: Leaderboard & Network Stats */}
          <div
            className="flex flex-col gap-1.5 pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'top left' }}
          >
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 max-w-[190px] sm:max-w-xs shadow-lg">
              <div className="flex items-center space-x-1.5 text-xs font-orbitron font-bold text-amber-400 mb-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>{t.leaderboard}</span>
              </div>
              <div className="space-y-1">
                {topPlayers.map((tp, idx) => (
                  <div key={tp.id ? `lb-${tp.id}` : `lb-idx-${idx}`} className="flex items-center justify-between text-xs font-mono">
                    <span className="truncate text-slate-300 max-w-[100px]">
                      #{idx + 1} {tp.name}
                    </span>
                    <span className="text-cyan-400 font-bold ml-2">{tp.score || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FPS & Latency stats */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-sm self-start shadow-md">
              <span className={`flex items-center gap-1 font-bold ${fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                <Activity className="w-3 h-3" /> {fps} FPS
              </span>
              <span>•</span>
              <button
                onClick={() => onToggleFpsBoost?.(!fpsBoost)}
                className={`px-1.5 py-0.5 rounded font-orbitron text-[9px] font-bold cursor-pointer transition-all ${
                  fpsBoost
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡</span> {fpsBoost ? '120 FPS' : '30-60'}
              </button>
              <span>•</span>
              <span
                className={`cursor-help font-bold ${
                  latency < 65 ? 'text-emerald-400' : latency < 120 ? 'text-cyan-400' : latency < 180 ? 'text-amber-400' : 'text-rose-400'
                }`}
                title={`WebSocket Ping: ${latency}ms | Avg: ${networkStats.avgPing}ms | Min: ${networkStats.minPing}ms | Jitter: ±${networkStats.jitter}ms`}
              >
                PING: {latency}ms
              </span>
              <span>•</span>
              <button
                onClick={() => onToggleDebug?.(!showDebug)}
                className={`px-1.5 py-0.2 rounded font-orbitron text-[9px] font-bold cursor-pointer transition-colors ${
                  showDebug
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-cyan-300'
                }`}
              >
                DEBUG
              </button>
            </div>

            {showDebug && (
              <div className="mt-1 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
                <NetworkDebugOverlay stats={networkStats} lang={lang} onClose={() => onToggleDebug?.(false)} />
              </div>
            )}
          </div>

          {/* Center: Match Timer & Boss Health Bar */}
          <div
            className="flex flex-col items-center pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'top center' }}
          >
            {/* Cinematic Boss Raid Bar (When Boss is Active) */}
            {activeBoss && activeBoss.health > 0 && (
              <div className="w-80 sm:w-96 bg-slate-950/95 border border-rose-500/50 rounded-xl p-2.5 shadow-[0_0_25px_rgba(244,63,94,0.35)] mb-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center justify-between text-[11px] font-orbitron font-bold text-rose-300 mb-1">
                  <span className="flex items-center gap-1.5 truncate">
                    ⚔️ {activeBoss.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-400 border border-rose-700">
                    {activeBoss.phase === 3 ? '⚡ ФАЗА 3' : activeBoss.phase === 2 ? '🛡️ ФАЗА 2' : '💥 ФАЗА 1'}
                  </span>
                </div>
                {/* Shield Bar */}
                {activeBoss.shield > 0 && (
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/40 mb-1">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-100"
                      style={{ width: `${Math.max(0, (activeBoss.shield / activeBoss.maxShield) * 100)}%` }}
                    />
                  </div>
                )}
                {/* Health Bar */}
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-rose-900">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-rose-400 transition-all duration-100"
                    style={{ width: `${Math.max(0, (activeBoss.health / activeBoss.maxHealth) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>
                    HP: {Math.round(activeBoss.health).toLocaleString()} / {activeBoss.maxHealth.toLocaleString()}
                    {activeBoss.shield > 0 && (
                      <span className="text-cyan-400 ml-2">
                        | {lang === 'ru' ? 'ЩИТ' : 'SHIELD'}: {Math.round(activeBoss.shield).toLocaleString()} / {activeBoss.maxShield.toLocaleString()}
                      </span>
                    )}
                  </span>
                  {activeBoss.mvpPlayerName && (
                    <span className="text-amber-400 font-bold truncate max-w-[150px]">
                      👑 MVP: {activeBoss.mvpPlayerName}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div
              className={`px-5 py-1.5 rounded-xl backdrop-blur-md border font-orbitron font-black text-xl sm:text-2xl tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] ${
                timeRemaining <= 30
                  ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-950/80 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            <span className="text-[10px] font-mono text-cyan-400/70 tracking-widest mt-0.5 uppercase">
              {boss ? 'РЕЙД НА БОССА' : t.arenaCombat}
            </span>
          </div>

          {/* Right: Radar, Settings Gear & Kill feed */}
          <div
            className="flex flex-col items-end space-y-2 pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'top right' }}
          >
            <div className="flex items-start gap-1.5">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer shadow-md pointer-events-auto"
                  title="Настройки & Масштаб HUD"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              <div className="w-28 h-20 sm:w-36 sm:h-24 bg-slate-950/90 border border-cyan-500/40 rounded-lg relative overflow-hidden shadow-md">
                <div className="absolute inset-0 cyber-grid opacity-30" />
                <div
                  className="absolute w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-300 animate-ping"
                  style={{
                    left: `${(localPredictedPos.current.x / mapWidth) * 100}%`,
                    top: `${(localPredictedPos.current.y / mapHeight) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
                {/* Boss radar marker */}
                {activeBoss && activeBoss.health > 0 && (
                  <div
                    className="absolute w-3 h-3 rounded-full bg-rose-600 ring-2 ring-rose-400 animate-ping z-10 shadow-[0_0_8px_rgba(244,63,94,1)]"
                    style={{
                      left: `${(activeBoss.x / mapWidth) * 100}%`,
                      top: `${(activeBoss.y / mapHeight) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
                {Object.entries(serverPlayersRef.current)
                  .filter(([pId, p]) => Boolean(p && pId !== localPlayerId && p.id !== localPlayerId && !p.isDead && (!p.stealthRemaining || p.stealthRemaining <= 0)))
                  .map(([pId, p]) => (
                    <div
                      key={`radar-desktop-${pId || p.id}`}
                      className="absolute w-1.5 h-1.5 rounded-full bg-rose-500"
                      style={{
                        left: `${((p.x || 0) / mapWidth) * 100}%`,
                        top: `${((p.y || 0) / mapHeight) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
              </div>
            </div>

            <div className="space-y-1 max-w-[220px]">
              {killFeed.slice(0, 3).map((kf, kfIdx) => (
                <div
                  key={kf.id ? `kf-${kf.id}` : `kf-idx-${kfIdx}`}
                  className="bg-slate-950/85 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-mono text-slate-300 flex items-center space-x-1.5"
                >
                  <span className="text-cyan-300 font-bold truncate">{kf.killerName}</span>
                  <Crosshair className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="text-rose-400 font-bold truncate">{kf.victimName}</span>
                </div>
              ))}
            </div>

            {onExitGame && (
              <button
                onClick={onExitGame}
                className="self-end px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title={lang === 'ru' ? 'Выйти в лобби' : 'Leave Match'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'ru' ? 'ВЫЙТИ' : 'EXIT'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* PHONE & SMALL SCREEN STREAMLINED COMPACT TOP HUD (Unobtrusive) */
        <div className="absolute top-1.5 inset-x-2 flex items-start justify-between pointer-events-none z-40 safe-pt safe-pl safe-pr">
          {/* Top Left: Compact Vitale Capsule (Hull + Shield + Weapon) */}
          {localPlayer && (
            <div
              className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1.5 sm:p-2 shadow-lg flex items-center gap-2 pointer-events-auto"
              style={{ transform: `scale(${uiScale})`, transformOrigin: 'top left' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-orbitron font-black text-[10px] text-slate-950 shrink-0 shadow-sm"
                style={{ backgroundColor: WEAPONS[localPlayer.weapon || 'plasma']?.color || '#06b6d4' }}
              >
                {localPlayer.weapon ? localPlayer.weapon.slice(0, 3).toUpperCase() : 'WPN'}
              </div>

              <div className="space-y-1 w-24 sm:w-32">
                {/* Hull HP Bar */}
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100"
                    style={{ width: `${Math.max(0, localPlayer.health || 0)}%` }}
                  />
                </div>
                {/* Shield Bar */}
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-100"
                    style={{ width: `${Math.max(0, localPlayer.shield || 0)}%` }}
                  />
                </div>
              </div>

              <div className="font-mono text-[9px] text-emerald-400 font-bold flex flex-col items-end leading-tight">
                <span>{localPlayer.health || 0}</span>
                <span className="text-cyan-400">{localPlayer.shield || 0}</span>
              </div>
            </div>
          )}

          {/* Top Center: Match Timer & Boss Health Bar on Mobile */}
          <div
            className="flex flex-col items-center pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'top center' }}
          >
            {activeBoss && activeBoss.health > 0 && (
              <div className="w-40 sm:w-52 bg-slate-950/95 border border-rose-500/50 rounded-lg p-1.5 shadow-md mb-1">
                <div className="flex items-center justify-between text-[9px] font-orbitron text-rose-300">
                  <span className="truncate">⚔️ {activeBoss.name || 'БОСС'}</span>
                  <span className="font-mono text-[8px] text-cyan-300">
                    {Math.round((activeBoss.health / activeBoss.maxHealth) * 100)}%
                  </span>
                </div>
                {activeBoss.shield > 0 && (
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/40 mt-0.5">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.max(0, (activeBoss.shield / activeBoss.maxShield) * 100)}%` }}
                    />
                  </div>
                )}
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-rose-900 mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-pink-500"
                    style={{ width: `${Math.max(0, (activeBoss.health / activeBoss.maxHealth) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mt-0.5">
                  <span>HP: {Math.round(activeBoss.health).toLocaleString()}</span>
                  {activeBoss.shield > 0 && (
                    <span className="text-cyan-400">
                      {lang === 'ru' ? 'ЩИТ' : 'SHD'}: {Math.round(activeBoss.shield).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div
              className={`px-3 py-1 rounded-xl backdrop-blur-md border font-orbitron font-black text-sm sm:text-base tracking-widest shadow-md ${
                timeRemaining <= 30
                  ? 'bg-rose-950/90 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-950/90 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            {localPlayer && (
              <span className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5">
                PTS: {localPlayer.score || 0}
              </span>
            )}
          </div>

          {/* Top Right: Radar Toggle, Settings & Latency Pill */}
          <div
            className="flex items-center gap-1 pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'top right' }}
          >
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg bg-slate-950/85 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer shadow-md"
                title="Настройки"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}

            {onExitGame && (
              <button
                onClick={onExitGame}
                className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 hover:text-white transition-all cursor-pointer shadow-md"
                title={lang === 'ru' ? 'Выйти в лобби' : 'Leave Match'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowMobileRadar(!showMobileRadar)}
              className={`p-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                showMobileRadar
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}
              title="Toggle Minimap Radar"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>

            <div className="px-1.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[9px] font-mono flex items-center gap-1 text-slate-300">
              <span className={fps >= 50 ? 'text-emerald-400' : 'text-amber-400'}>{fps}F</span>
              <span>•</span>
              <span className={latency < 65 ? 'text-emerald-400 font-bold' : latency < 120 ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>PING: {latency}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE EXPANDED RADAR (When toggled on small screens) */}
      {isSmallScreen && showMobileRadar && (
        <div className="absolute top-12 right-2 z-40 w-28 h-20 bg-slate-950/95 border border-cyan-500/50 rounded-lg overflow-hidden shadow-2xl animate-in fade-in duration-150">
          <div className="absolute inset-0 cyber-grid opacity-30" />
          <div
            className="absolute w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-300 animate-ping"
            style={{
              left: `${(localPredictedPos.current.x / mapWidth) * 100}%`,
              top: `${(localPredictedPos.current.y / mapHeight) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
          {Object.entries(serverPlayersRef.current)
            .filter(([pId, p]) => Boolean(p && pId !== localPlayerId && p.id !== localPlayerId && !p.isDead && (!p.stealthRemaining || p.stealthRemaining <= 0)))
            .map(([pId, p]) => (
              <div
                key={`radar-mobile-${pId || p.id}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-rose-500"
                style={{
                  left: `${((p.x || 0) / mapWidth) * 100}%`,
                  top: `${((p.y || 0) / mapHeight) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
        </div>
      )}

      {/* BOTTOM HUD FOR TABLET & DESKTOP (Hidden on small mobile to free thumb controls) */}
      {!isSmallScreen && localPlayer && (
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 flex items-end justify-between pointer-events-none z-20 safe-pb">
          {/* Vitals: Health & Shield Gauges */}
          <div
            className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 sm:p-4 shadow-[0_0_20px_rgba(6,182,212,0.2)] w-56 sm:w-80 pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'bottom left' }}
          >
            {/* Health */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs font-orbitron font-bold mb-1">
                <span className="text-emerald-400 uppercase text-[10px] sm:text-xs">{t.hullIntegrity}</span>
                <span className="font-mono text-emerald-300">{localPlayer.health || 0} / 100</span>
              </div>
              <div className="h-2 sm:h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100"
                  style={{ width: `${Math.max(0, localPlayer.health || 0)}%` }}
                />
              </div>
            </div>

            {/* Shield */}
            <div>
              <div className="flex items-center justify-between text-xs font-orbitron font-bold mb-1">
                <span className="text-cyan-400 flex items-center gap-1 uppercase text-[10px] sm:text-xs">
                  <Shield className="w-3 h-3 text-cyan-400" /> {t.energyShield}
                </span>
                <span className="font-mono text-cyan-300">{localPlayer.shield || 0} / 100</span>
              </div>
              <div className="h-2 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-100 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  style={{ width: `${Math.max(0, localPlayer.shield || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weapon and Dash Status */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 pointer-events-auto"
            style={{ transform: `scale(${uiScale})`, transformOrigin: 'bottom right' }}
          >
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2 sm:p-3 flex items-center space-x-2.5 shadow-lg">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-orbitron font-black text-xs text-slate-950 shadow-md shrink-0"
                style={{ backgroundColor: WEAPONS[localPlayer.weapon || 'plasma']?.color || '#06b6d4' }}
              >
                {localPlayer.weapon ? localPlayer.weapon.slice(0, 3).toUpperCase() : 'WPN'}
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase">{t.activeWeapon}</div>
                <div className="font-orbitron font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[90px] sm:max-w-none">
                  {WEAPONS[localPlayer.weapon || 'plasma']?.name || 'Plasma Blaster'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2 sm:p-3 flex items-center space-x-2 shadow-lg">
              <Zap
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  (localPlayer.dashCooldown ?? 0) <= 0 ? 'text-pink-400 animate-pulse' : 'text-slate-600'
                }`}
              />
              <div className="text-right">
                <div className="text-[9px] font-mono text-slate-400 uppercase">{t.turboDash}</div>
                <div className="font-orbitron font-bold text-[10px] sm:text-xs">
                  {(localPlayer.dashCooldown ?? 0) <= 0 ? (
                    <span className="text-pink-400 uppercase">{t.ready}</span>
                  ) : (
                    <span className="text-slate-500">{(((localPlayer.dashCooldown ?? 0) / 1000).toFixed(1))}s</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL MULTI-TOUCH VIRTUAL CONTROLLER FOR PHONES & TABLETS */}
      {showTouchControls && (
        <MobileVirtualControls
          settings={mobileSettings}
          dashCooldown={localPlayer?.dashCooldown ?? 0}
          activeWeapon={localPlayer?.weapon ?? 'plasma'}
          uiScale={uiScale}
          onMoveInput={(v) => {
            virtualMove.current = v;
          }}
          onAimInput={(angle, isShooting) => {
            virtualAim.current = { angle, isShooting };
          }}
          onFireChange={(firing) => {
            virtualFire.current = firing;
          }}
          onDash={handleTriggerMobileDash}
          onSecondaryAbility={handleCycleWeapon}
        />
      )}

      {/* RESPAWN OVERLAY */}
      {localPlayer?.isDead && (
        <div className="absolute inset-0 bg-rose-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-40 animate-in fade-in">
          <div className="text-2xl sm:text-5xl font-orbitron font-black text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.7)] tracking-wider mb-2">
            {t.vesselDestroyed}
          </div>
          <div className="text-xs sm:text-sm font-mono text-slate-300 animate-pulse">
            {t.rebuildingCore}
          </div>
        </div>
      )}
    </div>
  );
};
