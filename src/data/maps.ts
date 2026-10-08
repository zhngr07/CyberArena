import { GameMap } from '../types/game.ts';

export const MAPS: Record<string, GameMap> = {
  neon_grid: {
    id: 'neon_grid',
    name: 'Cyber Neon Grid (Неоновая Сетка)',
    theme: 'cyan',
    width: 2400,
    height: 1600,
    description: 'Classic cybernetic grid with balanced kinetic bumpers and tactical barriers.',
    gameplayFeature: 'Balanced competitive layout suitable for all weapons and playstyles.',
    obstacles: [
      { id: 'ng_c1', x: 1120, y: 720, width: 160, height: 160, type: 'explosive_core', health: 80, maxHealth: 80 },
      { id: 'ng_b1', x: 400, y: 250, width: 180, height: 180, type: 'barrier' },
      { id: 'ng_b2', x: 1820, y: 250, width: 180, height: 180, type: 'barrier' },
      { id: 'ng_b3', x: 400, y: 1170, width: 180, height: 180, type: 'barrier' },
      { id: 'ng_b4', x: 1820, y: 1170, width: 180, height: 180, type: 'barrier' },
      { id: 'ng_w1', x: 900, y: 350, width: 600, height: 70, type: 'barrier' },
      { id: 'ng_w2', x: 900, y: 1180, width: 600, height: 70, type: 'barrier' },
      { id: 'ng_bmp1', x: 920, y: 750, width: 110, height: 110, type: 'bumper' },
      { id: 'ng_bmp2', x: 1370, y: 750, width: 110, height: 110, type: 'bumper' },
    ],
    spawnPoints: [
      { x: 250, y: 250 },
      { x: 2150, y: 1350 },
      { x: 2150, y: 250 },
      { x: 250, y: 1350 },
      { x: 1200, y: 200 },
      { x: 1200, y: 1400 },
      { x: 300, y: 800 },
      { x: 2100, y: 800 },
    ],
  },
  asteroid_field: {
    id: 'asteroid_field',
    name: 'Asteroid Belt (Пояс Астероидов)',
    theme: 'amber',
    width: 2400,
    height: 1600,
    description: 'Dense field of ancient mineral asteroids and explosive raw geodes.',
    gameplayFeature: 'Destructible raw geodes and high tactical cover favor ambush play.',
    obstacles: [
      // Central mineral cluster
      { id: 'ast_core1', x: 1120, y: 720, width: 160, height: 160, type: 'explosive_core', health: 80, maxHealth: 80 },
      { id: 'ast_core2', x: 700, y: 400, width: 100, height: 100, type: 'explosive_core', health: 50, maxHealth: 50 },
      { id: 'ast_core3', x: 1600, y: 1100, width: 100, height: 100, type: 'explosive_core', health: 50, maxHealth: 50 },
      // Rock barriers
      { id: 'ast_b1', x: 400, y: 250, width: 180, height: 180, type: 'barrier' },
      { id: 'ast_b2', x: 1820, y: 250, width: 180, height: 180, type: 'barrier' },
      { id: 'ast_b3', x: 400, y: 1170, width: 180, height: 180, type: 'barrier' },
      { id: 'ast_b4', x: 1820, y: 1170, width: 180, height: 180, type: 'barrier' },
      { id: 'ast_w1', x: 900, y: 350, width: 600, height: 70, type: 'barrier' },
      { id: 'ast_w2', x: 900, y: 1180, width: 600, height: 70, type: 'barrier' },
      { id: 'ast_w3', x: 550, y: 650, width: 70, height: 300, type: 'barrier' },
      { id: 'ast_w4', x: 1780, y: 650, width: 70, height: 300, type: 'barrier' },
      // Kinetic bouncing asteroids
      { id: 'ast_bmp1', x: 920, y: 750, width: 110, height: 110, type: 'bumper' },
      { id: 'ast_bmp2', x: 1370, y: 750, width: 110, height: 110, type: 'bumper' },
    ],
    spawnPoints: [
      { x: 250, y: 250 },
      { x: 2150, y: 1350 },
      { x: 2150, y: 250 },
      { x: 250, y: 1350 },
      { x: 1200, y: 200 },
      { x: 1200, y: 1400 },
      { x: 300, y: 800 },
      { x: 2100, y: 800 },
    ],
  },

  space_station: {
    id: 'space_station',
    name: 'Sector 7 Station (Космическая Станция)',
    theme: 'cyan',
    width: 2200,
    height: 1500,
    description: 'Armored orbital habitat with reinforced airlocks and narrow corridors.',
    gameplayFeature: 'Close-quarters chokepoints where Shotguns and Ricochet Cannon excel.',
    obstacles: [
      // Central reactor core
      { id: 'st_c1', x: 1000, y: 650, width: 200, height: 200, type: 'barrier' },
      // Airlock corridors
      { id: 'st_w1', x: 450, y: 350, width: 450, height: 60, type: 'barrier' },
      { id: 'st_w2', x: 1300, y: 350, width: 450, height: 60, type: 'barrier' },
      { id: 'st_w3', x: 450, y: 1090, width: 450, height: 60, type: 'barrier' },
      { id: 'st_w4', x: 1300, y: 1090, width: 450, height: 60, type: 'barrier' },
      // Vertical bulkhead bulkheads
      { id: 'st_v1', x: 700, y: 550, width: 60, height: 400, type: 'barrier' },
      { id: 'st_v2', x: 1440, y: 550, width: 60, height: 400, type: 'barrier' },
      // Deflector nodes
      { id: 'st_b1', x: 300, y: 700, width: 100, height: 100, type: 'bumper' },
      { id: 'st_b2', x: 1800, y: 700, width: 100, height: 100, type: 'bumper' },
      { id: 'st_core1', x: 1060, y: 400, width: 80, height: 80, type: 'explosive_core', health: 60, maxHealth: 60 },
      { id: 'st_core2', x: 1060, y: 1020, width: 80, height: 80, type: 'explosive_core', health: 60, maxHealth: 60 },
    ],
    spawnPoints: [
      { x: 220, y: 220 },
      { x: 1980, y: 1280 },
      { x: 1980, y: 220 },
      { x: 220, y: 1280 },
      { x: 1100, y: 180 },
      { x: 1100, y: 1320 },
      { x: 250, y: 750 },
      { x: 1950, y: 750 },
    ],
  },

  open_space: {
    id: 'open_space',
    name: 'Open Void (Открытый Космос)',
    theme: 'blue',
    width: 2600,
    height: 1800,
    description: 'Vast deep-space sector with minimal cover and immense sightlines.',
    gameplayFeature: 'Favors sniper Railguns, Laser pulses, and high-speed maneuvers.',
    obstacles: [
      // Sparse kinetic buoy reflectors in center
      { id: 'op_b1', x: 1250, y: 850, width: 100, height: 100, type: 'bumper' },
      { id: 'op_b2', x: 750, y: 500, width: 90, height: 90, type: 'bumper' },
      { id: 'op_b3', x: 1750, y: 500, width: 90, height: 90, type: 'bumper' },
      { id: 'op_b4', x: 750, y: 1200, width: 90, height: 90, type: 'bumper' },
      { id: 'op_b5', x: 1750, y: 1200, width: 90, height: 90, type: 'bumper' },
      // Minimal satellite relays
      { id: 'op_w1', x: 1200, y: 400, width: 200, height: 60, type: 'barrier' },
      { id: 'op_w2', x: 1200, y: 1340, width: 200, height: 60, type: 'barrier' },
      { id: 'op_w3', x: 500, y: 850, width: 60, height: 200, type: 'barrier' },
      { id: 'op_w4', x: 2040, y: 850, width: 60, height: 200, type: 'barrier' },
      // Explosive beacons
      { id: 'op_core1', x: 1050, y: 860, width: 75, height: 75, type: 'explosive_core', health: 45, maxHealth: 45 },
      { id: 'op_core2', x: 1475, y: 860, width: 75, height: 75, type: 'explosive_core', health: 45, maxHealth: 45 },
    ],
    spawnPoints: [
      { x: 300, y: 300 },
      { x: 2300, y: 1500 },
      { x: 2300, y: 300 },
      { x: 300, y: 1500 },
      { x: 1300, y: 250 },
      { x: 1300, y: 1550 },
      { x: 350, y: 900 },
      { x: 2250, y: 900 },
    ],
  },

  gravity_core: {
    id: 'gravity_core',
    name: 'Singularity Core (Гравитационное Ядро)',
    theme: 'purple',
    width: 2400,
    height: 1600,
    description: 'Black hole anomaly in the center exerting relentless gravitational pull.',
    gameplayFeature: 'Ships and projectiles are pulled inward; orbital mechanics govern flight!',
    obstacles: [
      // Central supermassive gravity well
      {
        id: 'singularity_well',
        x: 1200,
        y: 800,
        width: 140,
        height: 140,
        type: 'gravity_well',
        pullRadius: 750,
        pullForce: 180,
      },
      // Orbiting barrier rings
      { id: 'grav_w1', x: 900, y: 500, width: 240, height: 60, type: 'barrier' },
      { id: 'grav_w2', x: 1260, y: 1040, width: 240, height: 60, type: 'barrier' },
      { id: 'grav_w3', x: 650, y: 800, width: 60, height: 240, type: 'barrier' },
      { id: 'grav_w4', x: 1690, y: 560, width: 60, height: 240, type: 'barrier' },
      // Repulsor bumpers around singularity horizon
      { id: 'grav_b1', x: 1020, y: 680, width: 90, height: 90, type: 'bumper' },
      { id: 'grav_b2', x: 1290, y: 830, width: 90, height: 90, type: 'bumper' },
      { id: 'grav_core1', x: 800, y: 1100, width: 80, height: 80, type: 'explosive_core', health: 40, maxHealth: 40 },
      { id: 'grav_core2', x: 1520, y: 420, width: 80, height: 80, type: 'explosive_core', health: 40, maxHealth: 40 },
    ],
    spawnPoints: [
      { x: 280, y: 280 },
      { x: 2120, y: 1320 },
      { x: 2120, y: 280 },
      { x: 280, y: 1320 },
      { x: 1200, y: 200 },
      { x: 1200, y: 1400 },
      { x: 250, y: 800 },
      { x: 2150, y: 800 },
    ],
  },

  wormhole: {
    id: 'wormhole',
    name: 'Wormhole Nexus (Квантовый Разлом)',
    theme: 'rose',
    width: 2400,
    height: 1600,
    description: 'Ancient alien portals linking distant quadrants across subspace.',
    gameplayFeature: 'Fly into portals to instantly teleport across the map, flanking foes!',
    obstacles: [
      // 4 Interlinked Wormhole Portals
      { id: 'portal_nw', x: 450, y: 350, width: 110, height: 110, type: 'portal', targetPortalId: 'portal_se' },
      { id: 'portal_se', x: 1840, y: 1140, width: 110, height: 110, type: 'portal', targetPortalId: 'portal_nw' },
      { id: 'portal_ne', x: 1840, y: 350, width: 110, height: 110, type: 'portal', targetPortalId: 'portal_sw' },
      { id: 'portal_sw', x: 450, y: 1140, width: 110, height: 110, type: 'portal', targetPortalId: 'portal_ne' },
      // Fortified hub walls
      { id: 'wh_c1', x: 1050, y: 650, width: 300, height: 300, type: 'barrier' },
      { id: 'wh_w1', x: 800, y: 300, width: 800, height: 60, type: 'barrier' },
      { id: 'wh_w2', x: 800, y: 1240, width: 800, height: 60, type: 'barrier' },
      { id: 'wh_b1', x: 900, y: 800, width: 90, height: 90, type: 'bumper' },
      { id: 'wh_b2', x: 1410, y: 800, width: 90, height: 90, type: 'bumper' },
      { id: 'wh_core1', x: 1150, y: 450, width: 100, height: 100, type: 'explosive_core', health: 60, maxHealth: 60 },
      { id: 'wh_core2', x: 1150, y: 1050, width: 100, height: 100, type: 'explosive_core', health: 60, maxHealth: 60 },
    ],
    spawnPoints: [
      { x: 240, y: 240 },
      { x: 2160, y: 1360 },
      { x: 2160, y: 240 },
      { x: 240, y: 1360 },
      { x: 1200, y: 200 },
      { x: 1200, y: 1400 },
      { x: 250, y: 800 },
      { x: 2150, y: 800 },
    ],
  },

  debris_field: {
    id: 'debris_field',
    name: 'Wreckage Graveyard (Кладбище Кораблей)',
    theme: 'emerald',
    width: 2500,
    height: 1700,
    description: 'Shattered dreadnought hulls and floating scrap metals creating tactical trenches.',
    gameplayFeature: 'Narrow firing trenches and multiple explosive scrap cores.',
    obstacles: [
      // Massive fragmented hull trenches
      { id: 'deb_w1', x: 500, y: 350, width: 650, height: 80, type: 'barrier' },
      { id: 'deb_w2', x: 1350, y: 350, width: 650, height: 80, type: 'barrier' },
      { id: 'deb_w3', x: 500, y: 1270, width: 650, height: 80, type: 'barrier' },
      { id: 'deb_w4', x: 1350, y: 1270, width: 650, height: 80, type: 'barrier' },
      // Diagonal hull segments
      { id: 'deb_d1', x: 800, y: 650, width: 80, height: 400, type: 'barrier' },
      { id: 'deb_d2', x: 1620, y: 650, width: 80, height: 400, type: 'barrier' },
      // Volatile reactor wrecks
      { id: 'deb_c1', x: 1200, y: 800, width: 120, height: 120, type: 'explosive_core', health: 70, maxHealth: 70 },
      { id: 'deb_c2', x: 600, y: 800, width: 90, height: 90, type: 'explosive_core', health: 50, maxHealth: 50 },
      { id: 'deb_c3', x: 1810, y: 800, width: 90, height: 90, type: 'explosive_core', health: 50, maxHealth: 50 },
      // Scrap magnetic bumpers
      { id: 'deb_b1', x: 1000, y: 550, width: 100, height: 100, type: 'bumper' },
      { id: 'deb_b2', x: 1400, y: 1050, width: 100, height: 100, type: 'bumper' },
    ],
    spawnPoints: [
      { x: 260, y: 260 },
      { x: 2240, y: 1440 },
      { x: 2240, y: 260 },
      { x: 260, y: 1440 },
      { x: 1250, y: 200 },
      { x: 1250, y: 1500 },
      { x: 300, y: 850 },
      { x: 2200, y: 850 },
    ],
  },

  boss_arena: {
    id: 'boss_arena',
    name: 'Titan Void Sector (Сектор Древнего Титана)',
    theme: 'violet',
    width: 4800,
    height: 4800,
    description: 'Колоссальная карта 4800x4800 в глубоком космосе. Все игроки объединяются против Титана Пустоты!',
    gameplayFeature: 'Командный рейд: огонь по союзникам отключён, собирайте бустеры и наносите макс. урон Боссу!',
    obstacles: [
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
    ],
    spawnPoints: [
      { x: 1200, y: 1200 },
      { x: 3600, y: 1200 },
      { x: 1200, y: 3600 },
      { x: 3600, y: 3600 },
      { x: 2400, y: 900 },
      { x: 2400, y: 3900 },
      { x: 900, y: 2400 },
      { x: 3900, y: 2400 },
    ],
  },
};
