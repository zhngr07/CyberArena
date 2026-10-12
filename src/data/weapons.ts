import { WeaponModifier, WeaponType } from '../types/game.ts';

export type WeaponTag =
  | 'SPLIT_ALLOWED'
  | 'SPLIT_FORBIDDEN'
  | 'RICOCHET_NATURAL'
  | 'CHARGEABLE';

export interface WeaponConfig {
  name: string;
  type: WeaponType;
  color: string;
  fireRate: number; // ms between shots
  damage: number;
  speed: number; // px per second
  count: number; // number of projectiles
  spread: number; // angle dispersion in radians
  radius: number;
  ammoCost: number;
  tags: WeaponTag[];
  description: string;
  counterTip: string;
  isBurst?: boolean;
  burstCount?: number;
  burstDelay?: number;
  isMine?: boolean;
  isBeam?: boolean;
  isCharge?: boolean;
  explosionRadius?: number;
}

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  plasma: {
    name: 'Plasma Blaster',
    type: 'plasma',
    color: '#06b6d4', // Cyan
    fireRate: 170,
    damage: 14,
    speed: 820,
    count: 1,
    spread: 0.02,
    radius: 6,
    ammoCost: 1,
    tags: ['SPLIT_ALLOWED'],
    description: 'Balanced rapid-fire plasma blaster with reliable sustained projectile delivery.',
    counterTip: 'Out-range with Railgun or dodge using Dash maneuver.',
  },
  spread: {
    name: 'Spread Laser',
    type: 'spread',
    color: '#ec4899', // Pink
    fireRate: 360,
    damage: 9,
    speed: 720,
    count: 3,
    spread: 0.22,
    radius: 5,
    ammoCost: 1,
    tags: ['SPLIT_ALLOWED'],
    description: 'Triple energy bolt spread (9 dmg per bolt) ideal for mid-range dogfights.',
    counterTip: 'Keep distance; dispersion lowers effective damage at long range.',
  },
  railgun: {
    name: 'Neon Railgun',
    type: 'railgun',
    color: '#3b82f6', // Electric Blue
    fireRate: 980,
    damage: 52,
    speed: 1350,
    count: 1,
    spread: 0,
    radius: 7,
    ammoCost: 1,
    tags: ['SPLIT_FORBIDDEN'],
    description: 'High-velocity precision kinetic slug delivering 52 damage. Stops at walls.',
    counterTip: 'Dodge on the laser cue; cannot penetrate solid obstacles.',
  },
  burst_cannon: {
    name: 'Burst Cannon',
    type: 'burst_cannon',
    color: '#f59e0b', // Amber / Gold
    fireRate: 500, // Inter-burst cycle
    damage: 11,
    speed: 880,
    count: 1,
    spread: 0.03,
    radius: 5.5,
    ammoCost: 1,
    isBurst: true,
    burstCount: 3,
    burstDelay: 85,
    tags: ['SPLIT_ALLOWED'],
    description: 'Fires high-precision 3-shot bursts (11 dmg each). Punishes exposed targets.',
    counterTip: 'Dash between bursts to evade follow-up shots.',
  },
  missile_launcher: {
    name: 'Missile Launcher',
    type: 'missile_launcher',
    color: '#ef4444', // Red-orange
    fireRate: 750,
    damage: 24,
    speed: 600,
    count: 1,
    spread: 0.04,
    radius: 7.5,
    explosionRadius: 75,
    ammoCost: 1,
    tags: ['SPLIT_FORBIDDEN'],
    description: 'Direct ballistic micro-rocket dealing 24 damage with kinetic splash.',
    counterTip: 'Lead incoming rockets into barriers or dash away from the impact.',
  },
  laser_beam: {
    name: 'Pulse Laser',
    type: 'laser_beam',
    color: '#10b981', // Emerald
    fireRate: 85,
    damage: 4,
    speed: 1750,
    count: 1,
    spread: 0.01,
    radius: 4,
    ammoCost: 1,
    isBeam: true,
    tags: ['SPLIT_ALLOWED'],
    description: 'Rapid concentrated beam pulses (4 dmg per tick) delivering continuous pressure.',
    counterTip: 'Take cover behind solid barriers; lasers cannot penetrate terrain.',
  },
  plasma_shotgun: {
    name: 'Plasma Shotgun',
    type: 'plasma_shotgun',
    color: '#8b5cf6', // Violet
    fireRate: 540,
    damage: 6, // per pellet (5 pellets = 30 max point-blank damage)
    speed: 700,
    count: 5,
    spread: 0.38,
    radius: 5,
    ammoCost: 1,
    tags: ['SPLIT_ALLOWED'],
    description: 'Short-range kinetic scatter (6 dmg per pellet, 5 pellets) with high spread.',
    counterTip: 'Stay outside close range; pellets disperse harmlessly at distance.',
  },
  emp_cannon: {
    name: 'EMP Disruptor',
    type: 'emp_cannon',
    color: '#06b6d4', // Cyan neon
    fireRate: 520,
    damage: 13,
    speed: 760,
    count: 1,
    spread: 0.02,
    radius: 7,
    ammoCost: 1,
    tags: [],
    description: 'Disrupts power systems: 13 damage, stops shield regen for 3.5s and delays Dash.',
    counterTip: 'Avoid direct hits; shields will not regenerate while afflicted by EMP.',
  },
  mine_launcher: {
    name: 'Mine Launcher',
    type: 'mine_launcher',
    color: '#e11d48', // Rose
    fireRate: 680,
    damage: 32,
    speed: 240, // Slow launch drift
    count: 1,
    spread: 0,
    radius: 9,
    isMine: true,
    explosionRadius: 90,
    ammoCost: 1,
    tags: ['SPLIT_FORBIDDEN'],
    description: 'Deploys proximity mines dealing 32 damage upon enemy approach.',
    counterTip: 'Detonate mines from afar with standard blaster fire.',
  },
  ricochet_cannon: {
    name: 'Ricochet Cannon',
    type: 'ricochet_cannon',
    color: '#a855f7', // Purple
    fireRate: 260,
    damage: 13,
    speed: 820,
    count: 1,
    spread: 0.02,
    radius: 6,
    ammoCost: 1,
    tags: ['RICOCHET_NATURAL', 'SPLIT_ALLOWED'],
    description: 'Hardened kinetic slugs (13 dmg) that bounce off barriers up to 3 times.',
    counterTip: 'Beware of corner bank shots; fight in open arenas.',
  },
  charge_beam: {
    name: 'Heavy Beam Cannon',
    type: 'charge_beam',
    color: '#38bdf8', // Sky blue
    fireRate: 620,
    damage: 18, // scales up to 42 when fully charged
    speed: 1450,
    count: 1,
    spread: 0,
    radius: 8,
    ammoCost: 1,
    isCharge: true,
    tags: ['CHARGEABLE'],
    description: 'Hold fire to charge a heavy beam blast scaling from 18 up to 42 damage.',
    counterTip: 'Rush the operator while they are vulnerable during charging.',
  },
};

// Modifier Configs and Descriptions
export interface ModifierMeta {
  type: WeaponModifier;
  name: string;
  nameRu: string;
  icon: string;
  color: string;
  description: string;
  descriptionRu: string;
}

export const MODIFIER_METAS: Record<WeaponModifier, ModifierMeta> = {
  split: {
    type: 'split',
    name: 'Cluster Split',
    nameRu: 'Кластерное деление',
    icon: '💥',
    color: '#ec4899',
    description: 'Projectiles shatter into 3 child fragments upon obstacle or enemy impact.',
    descriptionRu: 'Разделяется на 3 осколка при ударе о стены или вражеские корабли.',
  },
  explosive: {
    type: 'explosive',
    name: 'Explosive Core',
    nameRu: 'Взрывной сердечник',
    icon: '💣',
    color: '#ef4444',
    description: 'Adds an explosive detonation radius dealing splash damage to nearby ships.',
    descriptionRu: 'Взрывной сплеш при детонации, наносит урон по площади вокруг цели.',
  },
  ricochet: {
    type: 'ricochet',
    name: 'Kinetic Bumper',
    nameRu: 'Рикошет',
    icon: '🔄',
    color: '#8b5cf6',
    description: 'Projectiles deflect off barriers up to 3 times without losing kinetic energy.',
    descriptionRu: 'Отскакивает от стен и ящиков до 3 раз без потери кинетической энергии.',
  },
  overcharge: {
    type: 'overcharge',
    name: 'Overcharge Cell',
    nameRu: 'Перегрузка',
    icon: '🔋',
    color: '#f97316',
    description: '+25% damage per shot with a +25% cooldown increase.',
    descriptionRu: '+25% урона за выстрел при увеличении времени перезарядки на +25%.',
  },
  shield_breaker: {
    type: 'shield_breaker',
    name: 'Shield Disruptor',
    nameRu: 'Разрушитель щитов',
    icon: '🛡️',
    color: '#06b6d4',
    description: '+75% bonus damage dealt directly to enemy energy shields.',
    descriptionRu: '+75% бонусного урона по синим энергощитам цели.',
  },
  armor_piercer: {
    type: 'armor_piercer',
    name: 'Hull Penetrator',
    nameRu: 'Пробитие корпуса',
    icon: '🗡️',
    color: '#e11d48',
    description: '35% of weapon damage bypasses energy shields directly to the enemy hull.',
    descriptionRu: '35% наносимого урона проходит сквозь щиты напрямую в корпус (Hull).',
  },
  emp: {
    type: 'emp',
    name: 'EMP Induction',
    nameRu: 'ЭМИ-индукция',
    icon: '📡',
    color: '#0ea5e9',
    description: 'Disables enemy shield recharge for 3.5s and delays their Dash maneuver.',
    descriptionRu: 'Блокирует перезарядку щитов врага на 3.5 сек и замедляет откат рывка.',
  },
  burn: {
    type: 'burn',
    name: 'Plasma Igniter',
    nameRu: 'Термо-поджог',
    icon: '🔥',
    color: '#f43f5e',
    description: 'Inflicts thermal burn dealing damage over 3 seconds.',
    descriptionRu: 'Термический поджог: наносит периодический урон горением в течение 3 секунд.',
  },
  freeze: {
    type: 'freeze',
    name: 'Cryo Stasis',
    nameRu: 'Крио-заморозка',
    icon: '❄️',
    color: '#a5f3fc',
    description: 'Slows enemy ship mobility and maneuverability by 35% on impact.',
    descriptionRu: 'Замедляет скорость цели и маневренность на 35% на 2.5 секунды.',
  },
  gravity: {
    type: 'gravity',
    name: 'Graviton Vortex',
    nameRu: 'Гравитонная воронка',
    icon: '🌀',
    color: '#c084fc',
    description: 'Detonation pulls nearby ships into the impact epicenter.',
    descriptionRu: 'Создает микро-воронку притяжения, затягивая корабли врагов в эпицентр.',
  },
  chain: {
    type: 'chain',
    name: 'Arc Chain',
    nameRu: 'Цепная молния',
    icon: '⚡',
    color: '#fbbf24',
    description: 'Arcs electric lightning to the closest adjacent enemy within range.',
    descriptionRu: 'Цепной электрический разряд перескакивает на соседнего врага (40% урона).',
  },
};

/**
 * Modifier Compatibility System:
 * Validates combinations without fragile nested if-statements.
 */
export function checkModifierCompatibility(
  weaponType: WeaponType,
  modifier: WeaponModifier,
  activeModifiers: WeaponModifier[]
): { allowed: boolean; warning?: string; dimMultiplier?: number } {
  const weapon = WEAPONS[weaponType];
  if (!weapon) return { allowed: false, warning: 'Unknown weapon' };

  // Max 3 modifiers per build for clean readability
  if (activeModifiers.length >= 3 && !activeModifiers.includes(modifier)) {
    return { allowed: false, warning: 'Maximum 3 active weapon modifiers reached' };
  }

  // Already equipped check
  if (activeModifiers.includes(modifier)) {
    return { allowed: false, warning: 'Modifier already active in current build' };
  }

  // Tag-based rules
  if (modifier === 'split' && weapon.tags.includes('SPLIT_FORBIDDEN')) {
    return { allowed: false, warning: `${weapon.name} projectile architecture cannot split` };
  }

  if (modifier === 'ricochet' && weapon.tags.includes('RICOCHET_NATURAL')) {
    return { allowed: false, warning: `${weapon.name} already has natural kinetic ricochet` };
  }

  return { allowed: true };
}

export const GAME_CONSTANTS = {
  PLAYER_RADIUS: 24,
  BASE_SPEED: 320,
  DASH_SPEED: 720,
  DASH_DURATION: 240, // ms
  DASH_COOLDOWN: 3000, // ms
  DASH_INVULN_WINDOW: 180, // ms (invulnerability window during dash)
  PERFECT_DASH_RADIUS: 46, // px (bullet proximity trigger for perfect dash)
  MAX_HULL: 100,
  MAX_HEALTH: 100,
  MAX_SHIELD: 100,
  SHIELD_REGEN_DELAY: 4500, // ms after last damage before shield begins regen
  SHIELD_REGEN_RATE: 24, // shield points recovered per second
  RESPAWN_DELAY: 3000, // ms
  INVULNERABLE_TIME: 2200, // ms after respawn
  MATCH_DURATION_SECONDS: 180, // 3 minutes
  TICK_RATE: 60, // 60 ticks/second (16.67ms)
  TICK_INTERVAL_MS: 1000 / 60,
  SCORE_KILL: 100,
  SCORE_ASSIST: 40,
  SCORE_BOUNTY_BASE: 150,
  SCORE_PERFECT_DASH: 35,
  SCORE_CORE_DESTROY: 50,
  SCORE_POWERUP_COLLECT: 25,
};
