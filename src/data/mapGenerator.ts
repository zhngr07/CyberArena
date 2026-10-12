import { GameMap, MapObstacle, Vector2D, DynamicEventType } from '../types/game.ts';
import { MAP_SPECIFIC_EVENTS } from './events.ts';

export type ArenaPresetId =
  | 'nebula_arena'
  | 'asteroid_field'
  | 'orbital_station'
  | 'crystal_expanse'
  | 'void_arena'
  | 'boss_arena';

export interface MapGeneratorOptions {
  seed?: number;
  proceduralVariation?: boolean;
  density?: 'sparse' | 'balanced' | 'dense';
}

export interface PresetMetadata {
  id: ArenaPresetId;
  name: string;
  nameRu: string;
  nameEn: string;
  theme: string;
  width: number;
  height: number;
  openCoverRatio: string;
  openCoverRatioRu: string;
  tacticalDescription: string;
  tacticalDescriptionRu: string;
  tacticalDescriptionEn: string;
  gameplayFeature: string;
  gameplayFeatureRu: string;
  gameplayFeatureEn: string;
  keyTactics: string[];
  keyTacticsRu: string[];
  keyTacticsEn: string[];
  events: DynamicEventType[];
}

/** Simple linear congruential generator for deterministic procedural map variants */
function createPrng(seed: number) {
  let s = Math.abs(seed) % 2147483647;
  if (s === 0) s = 123456789;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Check if two Axis-Aligned Bounding Boxes with padding collide */
export function checkAABBCollision(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding: number = 0
): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

/** Validate that a spawn point is safely clear of all obstacles and map edges */
export function validateSpawnPoint(
  pt: Vector2D,
  obstacles: MapObstacle[],
  mapWidth: number,
  mapHeight: number,
  minClearance: number = 90
): boolean {
  // Check boundary clearance
  if (
    pt.x < minClearance ||
    pt.x > mapWidth - minClearance ||
    pt.y < minClearance ||
    pt.y > mapHeight - minClearance
  ) {
    return false;
  }

  // Check obstacle clearance
  for (const obs of obstacles) {
    const closestX = Math.max(obs.x, Math.min(pt.x, obs.x + obs.width));
    const closestY = Math.max(obs.y, Math.min(pt.y, obs.y + obs.height));
    const dist = Math.hypot(pt.x - closestX, pt.y - closestY);
    if (dist < minClearance) {
      return false;
    }
  }

  return true;
}

/** Adjust or relocate a spawn point if it is too close to an obstacle */
export function ensureSafeSpawnPoint(
  candidate: Vector2D,
  obstacles: MapObstacle[],
  mapWidth: number,
  mapHeight: number,
  minClearance: number = 95
): Vector2D {
  if (validateSpawnPoint(candidate, obstacles, mapWidth, mapHeight, minClearance)) {
    return { x: Math.round(candidate.x), y: Math.round(candidate.y) };
  }

  // Search spiral outwards for nearest safe coordinate
  const step = 40;
  for (let r = step; r <= 320; r += step) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const testPt = {
        x: candidate.x + Math.cos(angle) * r,
        y: candidate.y + Math.sin(angle) * r,
      };
      if (validateSpawnPoint(testPt, obstacles, mapWidth, mapHeight, minClearance)) {
        return { x: Math.round(testPt.x), y: Math.round(testPt.y) };
      }
    }
  }

  // Default fallback safe corner
  return {
    x: Math.round(Math.max(minClearance, Math.min(mapWidth - minClearance, candidate.x))),
    y: Math.round(Math.max(minClearance, Math.min(mapHeight - minClearance, candidate.y))),
  };
}

// -------------------------------------------------------------
// PRESET GENERATION IMPLEMENTATIONS
// -------------------------------------------------------------

/**
 * 1. NEBULA ARENA GENERATOR
 * Cosmic nebula, colored interstellar dust clouds, curved wing barriers,
 * central plasma core, luminous bumpers, and dual flanking dogfight channels.
 */
function generateNebulaArena(opts: MapGeneratorOptions = {}): GameMap {
  const width = 2600;
  const height = 1700;
  const rng = opts.seed !== undefined ? createPrng(opts.seed) : () => 0.5;
  const jitter = (range: number) => (opts.proceduralVariation ? (rng() - 0.5) * range : 0);

  const obstacles: MapObstacle[] = [
    // Central Volatile Plasma Core (high risk/reward focal point)
    {
      id: 'neb_core_main',
      x: 1200 + jitter(40),
      y: 750 + jitter(30),
      width: 200,
      height: 200,
      type: 'explosive_core',
      health: 85,
      maxHealth: 85,
    },

    // Upper Wing Symmetrical Barriers (curved lane dividers)
    { id: 'neb_wing_top_l', x: 740 + jitter(30), y: 360, width: 440, height: 75, type: 'barrier' },
    { id: 'neb_wing_top_r', x: 1420 + jitter(30), y: 360, width: 440, height: 75, type: 'barrier' },

    // Lower Wing Symmetrical Barriers
    { id: 'neb_wing_bot_l', x: 740 + jitter(30), y: 1265, width: 440, height: 75, type: 'barrier' },
    { id: 'neb_wing_bot_r', x: 1420 + jitter(30), y: 1265, width: 440, height: 75, type: 'barrier' },

    // Flanking Outer Dogfight Pylons (vertical cover creating outer transit bypass)
    { id: 'neb_pylon_l', x: 440, y: 620 + jitter(40), width: 90, height: 460, type: 'barrier' },
    { id: 'neb_pylon_r', x: 2070, y: 620 + jitter(40), width: 90, height: 460, type: 'barrier' },

    // Central Kinetic Deflector Bumpers (bouncing dogfight zones)
    { id: 'neb_bmp_l', x: 960 + jitter(20), y: 800, width: 100, height: 100, type: 'bumper' },
    { id: 'neb_bmp_r', x: 1540 + jitter(20), y: 800, width: 100, height: 100, type: 'bumper' },

    // Tactical Flanking Explosive Beacons (anti-camping nodes)
    { id: 'neb_core_nw', x: 640, y: 790 + jitter(25), width: 85, height: 85, type: 'explosive_core', health: 50, maxHealth: 50 },
    { id: 'neb_core_se', x: 1875, y: 790 + jitter(25), width: 85, height: 85, type: 'explosive_core', health: 50, maxHealth: 50 },
  ];

  // Raw spawn points (corners, flanks, top/bottom midpoints)
  const rawSpawnPoints: Vector2D[] = [
    { x: 260, y: 260 },
    { x: 2340, y: 1440 },
    { x: 2340, y: 260 },
    { x: 260, y: 1440 },
    { x: 1300, y: 180 },
    { x: 1300, y: 1520 },
    { x: 260, y: 850 },
    { x: 2340, y: 850 },
  ];

  const spawnPoints = rawSpawnPoints.map((pt) =>
    ensureSafeSpawnPoint(pt, obstacles, width, height, 95)
  );

  return {
    id: 'nebula_arena',
    name: 'Nebula Arena (Космическая Туманность)',
    theme: 'purple',
    width,
    height,
    description: 'Vibrant interstellar gas clouds with luminous alloy barriers and flanking wings.',
    gameplayFeature: 'Dual curved flanking lanes and central plasma core create dynamic cat-and-mouse dogfights.',
    obstacles,
    spawnPoints,
  };
}

/**
 * 2. ASTEROID FIELD GENERATOR
 * Massive craggy ancient space rocks, winding stone passages,
 * kinetic bouncing boulders, destructible mineral geodes, rich ricochet angles.
 */
function generateAsteroidField(opts: MapGeneratorOptions = {}): GameMap {
  const width = 2500;
  const height = 1700;
  const rng = opts.seed !== undefined ? createPrng(opts.seed) : () => 0.5;
  const jitter = (range: number) => (opts.proceduralVariation ? (rng() - 0.5) * range : 0);

  const obstacles: MapObstacle[] = [
    // Central Mineral Geode Cluster
    {
      id: 'ast_core_center',
      x: 1160 + jitter(30),
      y: 760 + jitter(30),
      width: 180,
      height: 180,
      type: 'explosive_core',
      health: 80,
      maxHealth: 80,
    },

    // Destructible Quadrant Geodes (tactical cover that can be shattered)
    { id: 'ast_geode_nw', x: 680 + jitter(25), y: 440, width: 95, height: 95, type: 'explosive_core', health: 50, maxHealth: 50 },
    { id: 'ast_geode_se', x: 1720 + jitter(25), y: 1160, width: 95, height: 95, type: 'explosive_core', health: 50, maxHealth: 50 },

    // Staggered Heavy Asteroid Monoliths (square crags)
    { id: 'ast_rock_nw', x: 440 + jitter(20), y: 280, width: 190, height: 190, type: 'barrier' },
    { id: 'ast_rock_ne', x: 1870 + jitter(20), y: 280, width: 190, height: 190, type: 'barrier' },
    { id: 'ast_rock_sw', x: 440 + jitter(20), y: 1230, width: 190, height: 190, type: 'barrier' },
    { id: 'ast_rock_se', x: 1870 + jitter(20), y: 1230, width: 190, height: 190, type: 'barrier' },

    // Longitudinal Ridge Asteroids (long defensive rock bars)
    { id: 'ast_ridge_top', x: 960 + jitter(30), y: 380, width: 580, height: 80, type: 'barrier' },
    { id: 'ast_ridge_bot', x: 960 + jitter(30), y: 1240, width: 580, height: 80, type: 'barrier' },

    // Vertical Ambush Ridges
    { id: 'ast_ridge_l', x: 580, y: 680 + jitter(30), width: 80, height: 340, type: 'barrier' },
    { id: 'ast_ridge_r', x: 1840, y: 680 + jitter(30), width: 80, height: 340, type: 'barrier' },

    // Kinetic Tumbling Asteroid Bumpers
    { id: 'ast_bmp_l', x: 910 + jitter(20), y: 795, width: 115, height: 115, type: 'bumper' },
    { id: 'ast_bmp_r', x: 1475 + jitter(20), y: 795, width: 115, height: 115, type: 'bumper' },
  ];

  const rawSpawnPoints: Vector2D[] = [
    { x: 240, y: 240 },
    { x: 2260, y: 1460 },
    { x: 2260, y: 240 },
    { x: 240, y: 1460 },
    { x: 1250, y: 200 },
    { x: 1250, y: 1500 },
    { x: 250, y: 850 },
    { x: 2250, y: 850 },
  ];

  const spawnPoints = rawSpawnPoints.map((pt) =>
    ensureSafeSpawnPoint(pt, obstacles, width, height, 95)
  );

  return {
    id: 'asteroid_field',
    name: 'Asteroid Field (Поле Астероидов)',
    theme: 'amber',
    width,
    height,
    description: 'Dense belt of ancient space rocks, geode clusters, and kinetic bumpers.',
    gameplayFeature: 'Winding rock passages and destructible mineral geodes favor tactical ambushes and ricochets.',
    obstacles,
    spawnPoints,
  };
}

/**
 * 3. ORBITAL STATION GENERATOR
 * Armored naval orbital platform, geometric corridors, 3-lane symmetrical layout,
 * fortified energy bulkheads, central reactor core, station airlock choke points.
 */
function generateOrbitalStation(opts: MapGeneratorOptions = {}): GameMap {
  const width = 2600;
  const height = 1650;
  const rng = opts.seed !== undefined ? createPrng(opts.seed) : () => 0.5;
  const jitter = (range: number) => (opts.proceduralVariation ? (rng() - 0.5) * range : 0);

  const obstacles: MapObstacle[] = [
    // Central Reinforced Reactor Core (solid impenetrable naval hub)
    { id: 'orb_core_block', x: 1175, y: 700, width: 250, height: 250, type: 'barrier' },

    // Symmetrical Upper Arterial Bulkheads
    { id: 'orb_top_l', x: 500 + jitter(20), y: 390, width: 460, height: 75, type: 'barrier' },
    { id: 'orb_top_r', x: 1640 + jitter(20), y: 390, width: 460, height: 75, type: 'barrier' },

    // Symmetrical Lower Arterial Bulkheads
    { id: 'orb_bot_l', x: 500 + jitter(20), y: 1185, width: 460, height: 75, type: 'barrier' },
    { id: 'orb_bot_r', x: 1640 + jitter(20), y: 1185, width: 460, height: 75, type: 'barrier' },

    // Vertical Airlock Choke Partitions
    { id: 'orb_airlock_l', x: 770, y: 645 + jitter(20), width: 75, height: 360, type: 'barrier' },
    { id: 'orb_airlock_r', x: 1755, y: 645 + jitter(20), width: 75, height: 360, type: 'barrier' },

    // Station Perimeter Deflector Coils (kinetic bumpers)
    { id: 'orb_deflector_l', x: 360, y: 775, width: 100, height: 100, type: 'bumper' },
    { id: 'orb_deflector_r', x: 2140, y: 775, width: 100, height: 100, type: 'bumper' },

    // Power Generators (tactical destructible cores)
    { id: 'orb_gen_top', x: 1255, y: 440 + jitter(20), width: 90, height: 90, type: 'explosive_core', health: 65, maxHealth: 65 },
    { id: 'orb_gen_bot', x: 1255, y: 1120 + jitter(20), width: 90, height: 90, type: 'explosive_core', health: 65, maxHealth: 65 },
  ];

  const rawSpawnPoints: Vector2D[] = [
    { x: 250, y: 250 },
    { x: 2350, y: 1400 },
    { x: 2350, y: 250 },
    { x: 250, y: 1400 },
    { x: 1300, y: 200 },
    { x: 1300, y: 1450 },
    { x: 250, y: 825 },
    { x: 2350, y: 825 },
  ];

  const spawnPoints = rawSpawnPoints.map((pt) =>
    ensureSafeSpawnPoint(pt, obstacles, width, height, 95)
  );

  return {
    id: 'orbital_station',
    name: 'Orbital Station (Орбитальная Станция)',
    theme: 'cyan',
    width,
    height,
    description: 'Armored orbital platform with geometric corridors and fortified energy bulkheads.',
    gameplayFeature: 'Symmetrical high-tech bulkheads and airlock choke-points reward sharp positioning.',
    obstacles,
    spawnPoints,
  };
}

/**
 * 4. CRYSTAL EXPANSE GENERATOR
 * Alien crystalline monoliths, diamond-angled refraction barriers,
 * kinetic crystal bumpers, volatile resonance cores, and resonant quantum wormhole portals!
 */
function generateCrystalExpanse(opts: MapGeneratorOptions = {}): GameMap {
  const width = 2500;
  const height = 1700;
  const rng = opts.seed !== undefined ? createPrng(opts.seed) : () => 0.5;
  const jitter = (range: number) => (opts.proceduralVariation ? (rng() - 0.5) * range : 0);

  const obstacles: MapObstacle[] = [
    // Central Alien Crystal Spire
    { id: 'cry_spire_center', x: 1180, y: 780, width: 140, height: 140, type: 'barrier' },

    // Crystalline Monoliths (faceted square structures)
    { id: 'cry_mono_nw', x: 600 + jitter(25), y: 390, width: 130, height: 130, type: 'barrier' },
    { id: 'cry_mono_ne', x: 1770 + jitter(25), y: 390, width: 130, height: 130, type: 'barrier' },
    { id: 'cry_mono_sw', x: 600 + jitter(25), y: 1180, width: 130, height: 130, type: 'barrier' },
    { id: 'cry_mono_se', x: 1770 + jitter(25), y: 1180, width: 130, height: 130, type: 'barrier' },

    // Angled Refraction Walls
    { id: 'cry_wall_top', x: 920 + jitter(30), y: 500, width: 300, height: 75, type: 'barrier' },
    { id: 'cry_wall_bot', x: 1280 + jitter(30), y: 1125, width: 300, height: 75, type: 'barrier' },
    { id: 'cry_wall_l', x: 770, y: 780 + jitter(25), width: 75, height: 300, type: 'barrier' },
    { id: 'cry_wall_r', x: 1655, y: 620 + jitter(25), width: 75, height: 300, type: 'barrier' },

    // Prismatic Resonator Bumpers
    { id: 'cry_bmp_l', x: 1000 + jitter(20), y: 805, width: 95, height: 95, type: 'bumper' },
    { id: 'cry_bmp_r', x: 1405 + jitter(20), y: 805, width: 95, height: 95, type: 'bumper' },

    // Volatile Crystal Resonance Cores
    { id: 'cry_core_n', x: 1205, y: 380 + jitter(20), width: 90, height: 90, type: 'explosive_core', health: 55, maxHealth: 55 },
    { id: 'cry_core_s', x: 1205, y: 1230 + jitter(20), width: 90, height: 90, type: 'explosive_core', health: 55, maxHealth: 55 },

    // Resonant Quantum Wormhole Portals connecting East and West wings
    {
      id: 'cry_portal_west',
      x: 340,
      y: 810,
      width: 80,
      height: 80,
      type: 'portal',
      targetPortalId: 'cry_portal_east',
    },
    {
      id: 'cry_portal_east',
      x: 2080,
      y: 810,
      width: 80,
      height: 80,
      type: 'portal',
      targetPortalId: 'cry_portal_west',
    },
  ];

  const rawSpawnPoints: Vector2D[] = [
    { x: 260, y: 260 },
    { x: 2240, y: 1440 },
    { x: 2240, y: 260 },
    { x: 260, y: 1440 },
    { x: 1250, y: 190 },
    { x: 1250, y: 1510 },
    { x: 260, y: 980 },
    { x: 2240, y: 980 },
  ];

  const spawnPoints = rawSpawnPoints.map((pt) =>
    ensureSafeSpawnPoint(pt, obstacles, width, height, 95)
  );

  return {
    id: 'crystal_expanse',
    name: 'Crystal Expanse (Кристальная Пустошь)',
    theme: 'emerald',
    width,
    height,
    description: 'Alien quadrant dotted with crystalline monoliths, refracting prisms, and linked quantum wormholes.',
    gameplayFeature: 'Refractive prisms and dual quantum portals allow instant flank transitions across opposite sectors.',
    obstacles,
    spawnPoints,
  };
}

/**
 * 5. VOID ARENA GENERATOR
 * Stark high-contrast deep space void, minimalist monolithic columns,
 * immense open evasion lanes, standoff perimeter baffles, central micro-singularity gravity well.
 */
function generateVoidArena(opts: MapGeneratorOptions = {}): GameMap {
  const width = 2800;
  const height = 1800;
  const rng = opts.seed !== undefined ? createPrng(opts.seed) : () => 0.5;
  const jitter = (range: number) => (opts.proceduralVariation ? (rng() - 0.5) * range : 0);

  const obstacles: MapObstacle[] = [
    // Central Standoff Quad Pillars (spaced cover for sniper duels)
    { id: 'void_pillar_nw', x: 1140 + jitter(20), y: 680 + jitter(20), width: 120, height: 120, type: 'barrier' },
    { id: 'void_pillar_ne', x: 1540 + jitter(20), y: 680 + jitter(20), width: 120, height: 120, type: 'barrier' },
    { id: 'void_pillar_sw', x: 1140 + jitter(20), y: 1000 + jitter(20), width: 120, height: 120, type: 'barrier' },
    { id: 'void_pillar_se', x: 1540 + jitter(20), y: 1000 + jitter(20), width: 120, height: 120, type: 'barrier' },

    // Outer Monolithic Baffles (vertical cover shields against long-range crossfire)
    { id: 'void_baffle_wl', x: 620, y: 440 + jitter(30), width: 75, height: 340, type: 'barrier' },
    { id: 'void_baffle_wr', x: 2105, y: 440 + jitter(30), width: 75, height: 340, type: 'barrier' },
    { id: 'void_baffle_bl', x: 620, y: 1020 + jitter(30), width: 75, height: 340, type: 'barrier' },
    { id: 'void_baffle_br', x: 2105, y: 1020 + jitter(30), width: 75, height: 340, type: 'barrier' },

    // Kinetic Beacon Buoys (corner & center bouncing nodes)
    { id: 'void_buoy_w', x: 860, y: 855, width: 95, height: 95, type: 'bumper' },
    { id: 'void_buoy_e', x: 1845, y: 855, width: 95, height: 95, type: 'bumper' },

    // Central Micro-Singularity Gravity Well (curves shots and slingshot maneuvers)
    {
      id: 'void_singularity',
      x: 1350,
      y: 850,
      width: 100,
      height: 100,
      type: 'gravity_well',
      pullRadius: 360,
      pullForce: 130,
    },

    // Tactical Void Energy Beacons (destructible explosive nodes)
    { id: 'void_beacon_top', x: 1355, y: 500 + jitter(20), width: 90, height: 90, type: 'explosive_core', health: 50, maxHealth: 50 },
    { id: 'void_beacon_bot', x: 1355, y: 1210 + jitter(20), width: 90, height: 90, type: 'explosive_core', health: 50, maxHealth: 50 },
  ];

  const rawSpawnPoints: Vector2D[] = [
    { x: 280, y: 280 },
    { x: 2520, y: 1520 },
    { x: 2520, y: 280 },
    { x: 280, y: 1520 },
    { x: 1400, y: 200 },
    { x: 1400, y: 1600 },
    { x: 280, y: 900 },
    { x: 2520, y: 900 },
  ];

  const spawnPoints = rawSpawnPoints.map((pt) =>
    ensureSafeSpawnPoint(pt, obstacles, width, height, 95)
  );

  return {
    id: 'void_arena',
    name: 'Void Arena (Арена Пустоты)',
    theme: 'blue',
    width,
    height,
    description: 'Minimalist deep-space sector with stark neon monoliths, gravity singularity, and immense evasion lanes.',
    gameplayFeature: 'Maximized dogfight room with central micro-gravity well and spaced pillars for high-speed evasion and sniping.',
    obstacles,
    spawnPoints,
  };
}

/**
 * 6. BOSS ARENA PRESET (Titan Void Sector)
 * Massive 4800x4800 co-op raid map.
 */
function generateBossArena(): GameMap {
  const width = 4800;
  const height = 4800;

  const obstacles: MapObstacle[] = [
    // 4 Orbital Shield Pylons around arena center
    { id: 'pylon_nw', x: 1800, y: 1800, width: 140, height: 140, type: 'barrier' },
    { id: 'pylon_ne', x: 3000, y: 1800, width: 140, height: 140, type: 'barrier' },
    { id: 'pylon_sw', x: 1800, y: 3000, width: 140, height: 140, type: 'barrier' },
    { id: 'pylon_se', x: 3000, y: 3000, width: 140, height: 140, type: 'barrier' },

    // Outer defensive asteroid barriers
    { id: 'ba_b1', x: 1200, y: 900, width: 400, height: 80, type: 'barrier' },
    { id: 'ba_b2', x: 3200, y: 900, width: 400, height: 80, type: 'barrier' },
    { id: 'ba_b3', x: 1200, y: 3900, width: 400, height: 80, type: 'barrier' },
    { id: 'ba_b4', x: 3200, y: 3900, width: 400, height: 80, type: 'barrier' },

    { id: 'ba_v1', x: 800, y: 1800, width: 80, height: 500, type: 'barrier' },
    { id: 'ba_v2', x: 800, y: 2600, width: 80, height: 500, type: 'barrier' },
    { id: 'ba_v3', x: 4000, y: 1800, width: 80, height: 500, type: 'barrier' },
    { id: 'ba_v4', x: 4000, y: 2600, width: 80, height: 500, type: 'barrier' },

    // Explosive plasma generators
    { id: 'gen_1', x: 1500, y: 2400, width: 120, height: 120, type: 'explosive_core', health: 120, maxHealth: 120 },
    { id: 'gen_2', x: 3300, y: 2400, width: 120, height: 120, type: 'explosive_core', health: 120, maxHealth: 120 },
    { id: 'gen_3', x: 2400, y: 1400, width: 120, height: 120, type: 'explosive_core', health: 120, maxHealth: 120 },
    { id: 'gen_4', x: 2400, y: 3400, width: 120, height: 120, type: 'explosive_core', health: 120, maxHealth: 120 },

    // Gravitational kinetic bumpers
    { id: 'bmp_1', x: 2100, y: 2100, width: 110, height: 110, type: 'bumper' },
    { id: 'bmp_2', x: 2700, y: 2100, width: 110, height: 110, type: 'bumper' },
    { id: 'bmp_3', x: 2100, y: 2700, width: 110, height: 110, type: 'bumper' },
    { id: 'bmp_4', x: 2700, y: 2700, width: 110, height: 110, type: 'bumper' },
  ];

  const rawSpawnPoints: Vector2D[] = [
    { x: 1200, y: 1200 },
    { x: 3600, y: 1200 },
    { x: 1200, y: 3600 },
    { x: 3600, y: 3600 },
    { x: 2400, y: 900 },
    { x: 2400, y: 3900 },
    { x: 900, y: 2400 },
    { x: 3900, y: 2400 },
  ];

  const spawnPoints = rawSpawnPoints.map((pt) =>
    ensureSafeSpawnPoint(pt, obstacles, width, height, 110)
  );

  return {
    id: 'boss_arena',
    name: 'Titan Void Sector (Сектор Древнего Титана)',
    theme: 'violet',
    width,
    height,
    description: 'Колоссальная карта 4800x4800 в глубоком космосе. Все игроки объединяются против Титана Пустоты!',
    gameplayFeature: 'Командный рейд: огонь по союзникам отключён, собирайте бустеры и наносите макс. урон Боссу!',
    obstacles,
    spawnPoints,
  };
}

// -------------------------------------------------------------
// METADATA & PRESET REGISTRY
// -------------------------------------------------------------

export const PRESET_METADATA: Record<ArenaPresetId, PresetMetadata> = {
  nebula_arena: {
    id: 'nebula_arena',
    name: 'Nebula Arena',
    nameRu: 'Nebula Arena (Космическая Туманность)',
    nameEn: 'Nebula Arena',
    theme: 'purple',
    width: 2600,
    height: 1700,
    openCoverRatio: '68% Open / 32% Cover',
    openCoverRatioRu: '68% Открыто / 32% Укрытий',
    tacticalDescription: 'Vibrant interstellar gas clouds with luminous alloy barriers and flanking wings.',
    tacticalDescriptionRu: 'Яркие облака межзвёздного газа, светящиеся барьеры из сплавов и симметричные обходные крылья.',
    tacticalDescriptionEn: 'Vibrant interstellar gas clouds with luminous alloy barriers and flanking wings.',
    gameplayFeature: 'Dual curved flanking lanes and central plasma core create dynamic cat-and-mouse dogfights.',
    gameplayFeatureRu: 'Два фланговых рукава и центральное плазменное ядро создают динамичные тактические манёвры.',
    gameplayFeatureEn: 'Dual curved flanking lanes and central plasma core create dynamic cat-and-mouse dogfights.',
    keyTactics: ['Flank via upper/lower wing conduits', 'Detonate central core when enemies swarm', 'Use bumpers to ricochet escape'],
    keyTacticsRu: ['Обходите противников по верхним и нижним рукавам', 'Взрывайте плазменное ядро при скоплении врагов', 'Используйте кинетические бамперы для быстрого отскока'],
    keyTacticsEn: ['Flank via upper/lower wing conduits', 'Detonate central core when enemies swarm', 'Use bumpers to ricochet escape'],
    events: MAP_SPECIFIC_EVENTS.nebula_arena,
  },
  asteroid_field: {
    id: 'asteroid_field',
    name: 'Asteroid Field',
    nameRu: 'Asteroid Field (Поле Астероидов)',
    nameEn: 'Asteroid Field',
    theme: 'amber',
    width: 2500,
    height: 1700,
    openCoverRatio: '58% Open / 42% Cover',
    openCoverRatioRu: '58% Открыто / 42% Укрытий',
    tacticalDescription: 'Dense belt of ancient space rocks, geode clusters, and kinetic bumpers.',
    tacticalDescriptionRu: 'Плотный пояс древних астероидов, геоды минералов и каменные рикошетные коридоры.',
    tacticalDescriptionEn: 'Dense belt of ancient space rocks, geode clusters, and kinetic bumpers.',
    gameplayFeature: 'Winding rock passages and destructible mineral geodes favor tactical ambushes and ricochets.',
    gameplayFeatureRu: 'Извилистые каменные проходы и разрушаемые геоды идеальны для засад и рикошетов.',
    gameplayFeatureEn: 'Winding rock passages and destructible mineral geodes favor tactical ambushes and ricochets.',
    keyTactics: ['Corner ambush with Shotgun / Burst', 'Break destructible geodes to flush out campers', 'Ricochet shots off dense crags'],
    keyTacticsRu: ['Засады за углами со Дробовиком или Плазмой', 'Разрушайте геоды, чтобы выбить засевших врагов', 'Рикошетьте выстрелами от плотных скал'],
    keyTacticsEn: ['Corner ambush with Shotgun / Burst', 'Break destructible geodes to flush out campers', 'Ricochet shots off dense crags'],
    events: MAP_SPECIFIC_EVENTS.asteroid_field,
  },
  orbital_station: {
    id: 'orbital_station',
    name: 'Orbital Station',
    nameRu: 'Orbital Station (Орбитальная Станция)',
    nameEn: 'Orbital Station',
    theme: 'cyan',
    width: 2600,
    height: 1650,
    openCoverRatio: '62% Open / 38% Cover',
    openCoverRatioRu: '62% Открыто / 38% Укрытий',
    tacticalDescription: 'Armored orbital platform with geometric corridors and fortified energy bulkheads.',
    tacticalDescriptionRu: 'Бронированная платформа с технологическими коридорами и силовыми переборками.',
    tacticalDescriptionEn: 'Armored orbital platform with geometric corridors and fortified energy bulkheads.',
    gameplayFeature: 'Symmetrical high-tech bulkheads and airlock choke-points reward sharp positioning.',
    gameplayFeatureRu: 'Симметричные платформы и узкие шлюзы вознаграждают точное позиционирование.',
    gameplayFeatureEn: 'Symmetrical high-tech bulkheads and airlock choke-points reward sharp positioning.',
    keyTactics: ['Hold 3-lane cross-arterials', 'Control central reactor sightline', 'Use airlock choke-points for defensive dashes'],
    keyTacticsRu: ['Контролируйте 3 перекрестных коридора', 'Держите линию огня у центрального реактора', 'Используйте шлюзы для оборонительных рывков'],
    keyTacticsEn: ['Hold 3-lane cross-arterials', 'Control central reactor sightline', 'Use airlock choke-points for defensive dashes'],
    events: MAP_SPECIFIC_EVENTS.orbital_station,
  },
  crystal_expanse: {
    id: 'crystal_expanse',
    name: 'Crystal Expanse',
    nameRu: 'Crystal Expanse (Кристальная Экспансия)',
    nameEn: 'Crystal Expanse',
    theme: 'emerald',
    width: 2500,
    height: 1700,
    openCoverRatio: '64% Open / 36% Cover',
    openCoverRatioRu: '64% Открыто / 36% Укрытий',
    tacticalDescription: 'Alien quadrant dotted with crystalline monoliths, refracting prisms, and linked quantum wormholes.',
    tacticalDescriptionRu: 'Инопланетный сектор с кристаллическими монолитами, призмами и парными червоточинами.',
    tacticalDescriptionEn: 'Alien quadrant dotted with crystalline monoliths, refracting prisms, and linked quantum wormholes.',
    gameplayFeature: 'Refractive prisms and dual quantum portals allow instant flank transitions across opposite sectors.',
    gameplayFeatureRu: 'Парные квантовые червоточины позволяют мгновенно перемещаться между секторами.',
    gameplayFeatureEn: 'Refractive prisms and dual quantum portals allow instant flank transitions across opposite sectors.',
    keyTactics: ['Jump through wormholes to break pursuit', 'Ricochet lasers off angled prism monoliths', 'Zone opponents into resonance cores'],
    keyTacticsRu: ['Прыгайте в червоточины для отрыва от погони', 'Рикошетьте лазером от наклонных кристаллов', 'Заманивайте противников к резонансным кристаллам'],
    keyTacticsEn: ['Jump through wormholes to break pursuit', 'Ricochet lasers off angled prism monoliths', 'Zone opponents into resonance cores'],
    events: MAP_SPECIFIC_EVENTS.crystal_expanse,
  },
  void_arena: {
    id: 'void_arena',
    name: 'Void Arena',
    nameRu: 'Void Arena (Арена Бездны)',
    nameEn: 'Void Arena',
    theme: 'blue',
    width: 2800,
    height: 1800,
    openCoverRatio: '76% Open / 24% Cover',
    openCoverRatioRu: '76% Открыто / 24% Укрытий',
    tacticalDescription: 'Minimalist deep-space sector with stark neon monoliths, gravity singularity, and immense evasion lanes.',
    tacticalDescriptionRu: 'Минималистичная темная карта с неоновыми пилонами, гравитационной сингулярностью и зоной манёвра.',
    tacticalDescriptionEn: 'Minimalist deep-space sector with stark neon monoliths, gravity singularity, and immense evasion lanes.',
    gameplayFeature: 'Maximized dogfight room with central micro-gravity well and spaced pillars for high-speed evasion and sniping.',
    gameplayFeatureRu: 'Огромное пространство для маневрирования, микро-гравитационная сингулярность и пилоны.',
    gameplayFeatureEn: 'Maximized dogfight room with central micro-gravity well and spaced pillars for high-speed evasion and sniping.',
    keyTactics: ['Slingshot orbit around central singularity', 'Long-range railgun and missile dueling', 'Drift around monolithic pillars to break line-of-fire'],
    keyTacticsRu: ['Гравитационный разгон по орбите сингулярности', 'Снайперские дуэли с Рельсотроном и Ракетами', 'Манёвры вокруг монолитов для срыва прицела'],
    keyTacticsEn: ['Slingshot orbit around central singularity', 'Long-range railgun and missile dueling', 'Drift around monolithic pillars to break line-of-fire'],
    events: MAP_SPECIFIC_EVENTS.void_arena,
  },
  boss_arena: {
    id: 'boss_arena',
    name: 'Titan Void Sector',
    nameRu: 'Titan Void Sector (Рейд на Титана)',
    nameEn: 'Titan Void Sector',
    theme: 'violet',
    width: 4800,
    height: 4800,
    openCoverRatio: '85% Open / 15% Cover',
    openCoverRatioRu: '85% Открыто / 15% Укрытий',
    tacticalDescription: '4800x4800 deep-space colosseum for collaborative Titan Raid battles.',
    tacticalDescriptionRu: 'Колоссальная арена 4800x4800 для совместного рейда против Титана Пустоты.',
    tacticalDescriptionEn: '4800x4800 deep-space colosseum for collaborative Titan Raid battles.',
    gameplayFeature: 'Pylons shield against orbital boss lasers; powerup caches spawn along outer perimeter.',
    gameplayFeatureRu: 'Защитные пилоны спасают от лазеров Босса; бустеры разбросаны по внешнему периметру.',
    gameplayFeatureEn: 'Pylons shield against orbital boss lasers; powerup caches spawn along outer perimeter.',
    keyTactics: ['Take cover behind shield pylons during Titan laser barrage', 'Coordinate minion wave clears', 'Target generators for burst damage'],
    keyTacticsRu: ['Укрывайтесь за пилонами во время залпов Титана', 'Координируйте зачистку миньонов', 'Собирайте бустеры урона по периметру'],
    keyTacticsEn: ['Take cover behind shield pylons during Titan laser barrage', 'Coordinate minion wave clears', 'Target generators for burst damage'],
    events: MAP_SPECIFIC_EVENTS.boss_arena,
  },
};

/**
 * Main map generator entry point.
 * Generates a GameMap from the specified preset, applying procedural variations if options are provided.
 */
export function generateArenaMap(
  presetId: ArenaPresetId,
  options: MapGeneratorOptions = {}
): GameMap {
  let map: GameMap;
  switch (presetId) {
    case 'nebula_arena':
      map = generateNebulaArena(options);
      break;
    case 'asteroid_field':
      map = generateAsteroidField(options);
      break;
    case 'orbital_station':
      map = generateOrbitalStation(options);
      break;
    case 'crystal_expanse':
      map = generateCrystalExpanse(options);
      break;
    case 'void_arena':
      map = generateVoidArena(options);
      break;
    case 'boss_arena':
      map = generateBossArena();
      break;
    default:
      map = generateNebulaArena(options);
  }

  const meta = PRESET_METADATA[presetId] || PRESET_METADATA.nebula_arena;
  map.nameRu = meta.nameRu;
  map.nameEn = meta.nameEn;
  map.descriptionRu = meta.tacticalDescriptionRu;
  map.descriptionEn = meta.tacticalDescriptionEn;
  map.gameplayFeature = meta.gameplayFeatureRu;
  map.gameplayFeatureRu = meta.gameplayFeatureRu;
  map.gameplayFeatureEn = meta.gameplayFeatureEn;
  map.openCoverRatio = meta.openCoverRatio;
  map.openCoverRatioRu = meta.openCoverRatioRu;
  map.keyTactics = meta.keyTacticsRu;
  map.keyTacticsRu = meta.keyTacticsRu;
  map.keyTacticsEn = meta.keyTacticsEn;
  map.events = meta.events;

  return map;
}

/**
 * Generates all canonical preset maps.
 */
export function generateAllArenaPresets(): Record<ArenaPresetId, GameMap> {
  return {
    nebula_arena: generateArenaMap('nebula_arena'),
    asteroid_field: generateArenaMap('asteroid_field'),
    orbital_station: generateArenaMap('orbital_station'),
    crystal_expanse: generateArenaMap('crystal_expanse'),
    void_arena: generateArenaMap('void_arena'),
    boss_arena: generateArenaMap('boss_arena'),
  };
}
