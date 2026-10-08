import { WeaponModifier, WeaponType } from '../types/game.ts';

export type WeaponTag =
  | 'HOMING_ALLOWED'
  | 'HOMING_DIMINISHED'
  | 'HOMING_FORBIDDEN'
  | 'SPLIT_ALLOWED'
  | 'SPLIT_FORBIDDEN'
  | 'PIERCING_NATURAL'
  | 'PIERCING_ALLOWED'
  | 'PIERCING_LIMITED'
  | 'PIERCING_FORBIDDEN'
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
  piercing?: boolean;
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
    fireRate: 160,
    damage: 18,
    speed: 800,
    count: 1,
    spread: 0.02,
    radius: 6,
    ammoCost: 1,
    tags: ['HOMING_ALLOWED', 'SPLIT_ALLOWED', 'PIERCING_ALLOWED'],
    description: 'Balanced rapid-fire plasma bolts with reliable sustained DPS.',
    counterTip: 'Out-range with Railgun or dodge with Dash.',
  },
  spread: {
    name: 'Spread Laser',
    type: 'spread',
    color: '#ec4899', // Pink
    fireRate: 360,
    damage: 13,
    speed: 720,
    count: 3,
    spread: 0.22,
    radius: 5,
    ammoCost: 1,
    tags: ['SPLIT_ALLOWED', 'HOMING_ALLOWED', 'PIERCING_LIMITED'],
    description: 'Triple projectile spread ideal for mid-close range dogfights.',
    counterTip: 'Keep distance; damage drops outside close-quarters.',
  },
  railgun: {
    name: 'Neon Railgun',
    type: 'railgun',
    color: '#3b82f6', // Electric Blue
    fireRate: 850,
    damage: 48,
    speed: 1400,
    count: 1,
    spread: 0,
    radius: 7,
    piercing: true,
    ammoCost: 1,
    tags: ['PIERCING_NATURAL', 'HOMING_DIMINISHED', 'SPLIT_FORBIDDEN'],
    description: 'High-velocity armor-piercing projectile penetrating obstacles. Heavy cooldown.',
    counterTip: 'Dodge on firing cue; Homing on Railgun is severely diminished.',
  },
  burst_cannon: {
    name: 'Burst Cannon',
    type: 'burst_cannon',
    color: '#f59e0b', // Amber / Gold
    fireRate: 460, // Inter-burst cycle
    damage: 16,
    speed: 880,
    count: 1,
    spread: 0.03,
    radius: 5.5,
    ammoCost: 1,
    isBurst: true,
    burstCount: 3,
    burstDelay: 80,
    tags: ['HOMING_ALLOWED', 'SPLIT_ALLOWED', 'PIERCING_ALLOWED'],
    description: 'Fires high-precision 3-shot bursts. Punishes exposed targets.',
    counterTip: 'Dash during burst intervals; evade the first shot.',
  },
  missile_launcher: {
    name: 'Missile Launcher',
    type: 'missile_launcher',
    color: '#ef4444', // Red-orange
    fireRate: 720,
    damage: 36,
    speed: 520, // Accelerates over lifetime
    count: 1,
    spread: 0.05,
    radius: 8,
    explosionRadius: 85,
    ammoCost: 1,
    tags: ['HOMING_ALLOWED', 'SPLIT_FORBIDDEN', 'PIERCING_LIMITED'],
    description: 'Accelerating micro-rockets with deadly explosive area splash upon impact.',
    counterTip: 'Shoot down incoming rockets or lead them into barriers.',
  },
  laser_beam: {
    name: 'Pulse Laser',
    type: 'laser_beam',
    color: '#10b981', // Emerald
    fireRate: 75,
    damage: 7,
    speed: 1800,
    count: 1,
    spread: 0.01,
    radius: 4,
    ammoCost: 1,
    isBeam: true,
    tags: ['HOMING_FORBIDDEN', 'SPLIT_ALLOWED', 'PIERCING_ALLOWED'],
    description: 'Ultra-fast concentrated laser pulses delivering continuous pressure.',
    counterTip: 'Take cover behind solid barriers; lasers cannot penetrate terrain.',
  },
  plasma_shotgun: {
    name: 'Plasma Shotgun',
    type: 'plasma_shotgun',
    color: '#8b5cf6', // Violet
    fireRate: 520,
    damage: 15, // per pellet (5 pellets)
    speed: 680,
    count: 5,
    spread: 0.38,
    radius: 5,
    ammoCost: 1,
    tags: ['SPLIT_ALLOWED', 'HOMING_ALLOWED', 'PIERCING_LIMITED'],
    description: 'Devastating close-range scatter blast delivering massive kinetic knockback.',
    counterTip: 'Fight in wide open spaces; stay outside point-blank range.',
  },
  emp_cannon: {
    name: 'EMP Disruptor',
    type: 'emp_cannon',
    color: '#06b6d4', // Cyan neon
    fireRate: 500,
    damage: 18,
    speed: 740,
    count: 1,
    spread: 0.02,
    radius: 7,
    ammoCost: 1,
    tags: ['HOMING_FORBIDDEN', 'PIERCING_ALLOWED'],
    description: 'Disrupts enemy power systems: stops shield regen for 4s and increases Dash cooldown.',
    counterTip: 'Avoid direct hits; shields will not regenerate while afflicted by EMP.',
  },
  mine_launcher: {
    name: 'Mine Launcher',
    type: 'mine_launcher',
    color: '#e11d48', // Rose
    fireRate: 650,
    damage: 52,
    speed: 240, // Slow launch drift
    count: 1,
    spread: 0,
    radius: 10,
    isMine: true,
    explosionRadius: 100,
    ammoCost: 1,
    tags: ['HOMING_FORBIDDEN', 'SPLIT_FORBIDDEN', 'PIERCING_FORBIDDEN'],
    description: 'Deploys floating proximity mines that detonate on enemy approach.',
    counterTip: 'Detonate mines from afar with standard blaster fire.',
  },
  ricochet_cannon: {
    name: 'Ricochet Cannon',
    type: 'ricochet_cannon',
    color: '#a855f7', // Purple
    fireRate: 240,
    damage: 20,
    speed: 820,
    count: 1,
    spread: 0.02,
    radius: 6,
    ammoCost: 1,
    tags: ['RICOCHET_NATURAL', 'SPLIT_ALLOWED', 'HOMING_ALLOWED'],
    description: 'Hardened kinetic slugs that bounce cleanly off barriers up to 3 times.',
    counterTip: 'Beware of corner bank shots; fight in open arenas.',
  },
  charge_beam: {
    name: 'Heavy Beam Cannon',
    type: 'charge_beam',
    color: '#38bdf8', // Sky blue
    fireRate: 600,
    damage: 30, // scales up to 80 when fully charged
    speed: 1500,
    count: 1,
    spread: 0,
    radius: 8,
    ammoCost: 1,
    isCharge: true,
    tags: ['CHARGEABLE', 'HOMING_DIMINISHED', 'PIERCING_NATURAL'],
    description: 'Hold fire to charge a catastrophic wide-beam blast with immense range.',
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
  homing: {
    type: 'homing',
    name: 'Homing Thrusters',
    nameRu: 'Самонаведение',
    icon: '🎯',
    color: '#38bdf8',
    description: 'Steers projectiles towards nearby enemies with diminishing returns on heavy weapons.',
    descriptionRu: 'Коррекция траектории в сторону врага (на тяжелых пушках маневренность снижена).',
  },
  piercing: {
    type: 'piercing',
    name: 'Armor Piercer',
    nameRu: 'Бронебойность',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Projectiles penetrate barriers and pass through enemy hulls.',
    descriptionRu: 'Пробивает сквозь нескольких врагов и препятствия насквозь.',
  },
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
  rapid_fire: {
    type: 'rapid_fire',
    name: 'Overclock Cycle',
    nameRu: 'Скорострельность',
    icon: '⚡',
    color: '#10b981',
    description: '+40% fire rate speed at the cost of -15% reduced damage per shot.',
    descriptionRu: '+40% скорострельность стрельбы при -15% снижении урона за один выстрел.',
  },
  overcharge: {
    type: 'overcharge',
    name: 'Overcharge Cell',
    nameRu: 'Перегрузка',
    icon: '🔋',
    color: '#f97316',
    description: '+40% damage per shot with a +30% cooldown increase.',
    descriptionRu: '+40% урона за выстрел при увеличении времени перезарядки на +30%.',
  },
  shield_breaker: {
    type: 'shield_breaker',
    name: 'Shield Disruptor',
    nameRu: 'Разрушитель щитов',
    icon: '🛡️',
    color: '#06b6d4',
    description: '+100% bonus damage dealt directly to enemy energy shields.',
    descriptionRu: '+100% бонусного урона (удвоенный урон) по синим энергощитам цели.',
  },
  armor_piercer: {
    type: 'armor_piercer',
    name: 'Hull Penetrator',
    nameRu: 'Пробитие корпуса',
    icon: '🗡️',
    color: '#e11d48',
    description: '40% of weapon damage bypasses energy shields directly to the enemy hull.',
    descriptionRu: '40% наносимого урона пробивает сквозь щиты напрямую в зелёный корпус (Hull).',
  },
  emp: {
    type: 'emp',
    name: 'EMP Induction',
    nameRu: 'ЭМИ-индукция',
    icon: '📡',
    color: '#0ea5e9',
    description: 'Disables enemy shield recharge for 4s and delays their Dash maneuver.',
    descriptionRu: 'Блокирует перезарядку щитов врага на 4 сек и замедляет откат рывка.',
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
    description: 'Slows enemy ship mobility and maneuverability by 40% on impact.',
    descriptionRu: 'Замедляет скорость цели и маневренность на 40% на 2.5 секунды.',
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
    descriptionRu: 'Цепной электрический разряд перескакивает на соседнего врага (50% урона).',
  },
};

/**
 * Modifier Compatibility System:
 * Validates combinations, enforces diminishing returns (e.g. Railgun + Homing),
 * and prevents game-breaking exploits without fragile nested if-statements.
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

  // 1. Tag-based rules
  if (modifier === 'homing') {
    if (weapon.tags.includes('HOMING_FORBIDDEN')) {
      return { allowed: false, warning: `${weapon.name} cannot support Homing Thrusters` };
    }
    if (weapon.tags.includes('HOMING_DIMINISHED')) {
      // RAILGUN NERF: Diminishing returns applied
      return {
        allowed: true,
        warning: 'Diminishing effect: -20% speed, -15% damage, steering turn rate reduced by 75%',
        dimMultiplier: 0.25,
      };
    }
  }

  if (modifier === 'split' && weapon.tags.includes('SPLIT_FORBIDDEN')) {
    return { allowed: false, warning: `${weapon.name} projectile architecture cannot split` };
  }

  if (modifier === 'ricochet' && weapon.tags.includes('RICOCHET_NATURAL')) {
    return { allowed: false, warning: `${weapon.name} already has natural kinetic ricochet` };
  }

  if (modifier === 'piercing' && weapon.tags.includes('PIERCING_NATURAL')) {
    return { allowed: false, warning: `${weapon.name} naturally pierces barriers and targets` };
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
