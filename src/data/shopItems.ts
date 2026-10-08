import { HatType, PlayerCosmetics, ShipModelType, TitleType, TrailType } from '../types/game.ts';

export interface ShopItem {
  id: string;
  category: 'ship' | 'hat' | 'trail' | 'title';
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  price: number;
  value: ShipModelType | HatType | TrailType | TitleType;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const SHOP_ITEMS: ShopItem[] = [
  // SHIP MODELS
  {
    id: 'ship_phantom',
    category: 'ship',
    nameRu: 'Фантом-1 (Базовый)',
    nameEn: 'Phantom-1 (Standard)',
    descRu: 'Классический кибер-истребитель с треугольным фюзеляжем.',
    descEn: 'Classic swift cyber fighter with delta wing design.',
    price: 0,
    value: 'phantom',
    icon: '🚀',
    rarity: 'common',
  },
  {
    id: 'ship_dragon',
    category: 'ship',
    nameRu: 'Кибер-Дракон',
    nameEn: 'Cyber Dragon',
    descRu: 'Агрессивный силуэт со сдвоенными соплами и закрылками.',
    descEn: 'Aggressive twin-thruster fighter with forward swept wings.',
    price: 150,
    value: 'dragon',
    icon: '🐉',
    rarity: 'rare',
  },
  {
    id: 'ship_raven',
    category: 'ship',
    nameRu: 'Стелс-Ворон',
    nameEn: 'Stealth Raven',
    descRu: 'Граненый стелс-корпус с пониженной заметностью.',
    descEn: 'Angular stealth hull with dark facet armor.',
    price: 250,
    value: 'raven',
    icon: '🦅',
    rarity: 'rare',
  },
  {
    id: 'ship_dreadnought',
    category: 'ship',
    nameRu: 'Тяжёлый Дредноут',
    nameEn: 'Heavy Dreadnought',
    descRu: 'Массивный бронированный штурмовик с боковыми турелями.',
    descEn: 'Massive heavy armored combat vessel with side sponsons.',
    price: 400,
    value: 'dreadnought',
    icon: '🛡️',
    rarity: 'epic',
  },
  {
    id: 'ship_ufo',
    category: 'ship',
    nameRu: 'Квантовый Диск UFO',
    nameEn: 'Quantum Disc UFO',
    descRu: 'Левитирующий корабль с вращающимся внешним энергокольцом.',
    descEn: 'Spinning quantum ring with high-energy central core.',
    price: 600,
    value: 'ufo',
    icon: '🛸',
    rarity: 'legendary',
  },

  // HATS & ACCESSORIES
  {
    id: 'hat_none',
    category: 'hat',
    nameRu: 'Без аксессуара',
    nameEn: 'No Accessory',
    descRu: 'Стандартный вид без головного убора.',
    descEn: 'Clean standard ship without headgear.',
    price: 0,
    value: 'none',
    icon: '⭕',
    rarity: 'common',
  },
  {
    id: 'hat_crown',
    category: 'hat',
    nameRu: 'Золотая Корона 👑',
    nameEn: 'Golden Crown 👑',
    descRu: 'Сияющая корона для истинного властелина арены.',
    descEn: 'Gleaming royal crown for true arena masters.',
    price: 200,
    value: 'crown',
    icon: '👑',
    rarity: 'epic',
  },
  {
    id: 'hat_visor',
    category: 'hat',
    nameRu: 'Кибер-Очки / Визор',
    nameEn: 'Cyber Visor',
    descRu: 'Стильный неоновый визор пилота будущего.',
    descEn: 'Sleek HUD visor with animated targeting grid.',
    price: 120,
    value: 'visor',
    icon: '🕶️',
    rarity: 'rare',
  },
  {
    id: 'hat_horns',
    category: 'hat',
    nameRu: 'Неоновые Рога 😈',
    nameEn: 'Neon Horns 😈',
    descRu: 'Пылающие демонические рога устрашения соперников.',
    descEn: 'Glowing cyber demon horns that strike fear.',
    price: 180,
    value: 'horns',
    icon: '😈',
    rarity: 'rare',
  },
  {
    id: 'hat_halo',
    category: 'hat',
    nameRu: 'Ангельский Нимб 😇',
    nameEn: 'Angel Halo 😇',
    descRu: 'Парящий священный нимб из чистого белого света.',
    descEn: 'Luminous hovering holy halo of pure light.',
    price: 220,
    value: 'halo',
    icon: '😇',
    rarity: 'epic',
  },
  {
    id: 'hat_samurai',
    category: 'hat',
    nameRu: 'Шлем Самурая ⚔️',
    nameEn: 'Samurai Helm ⚔️',
    descRu: 'Традиционный японский кабуто с золотым полумесяцем.',
    descEn: 'Warrior kabuto helmet with golden crescent crest.',
    price: 300,
    value: 'samurai',
    icon: '⚔️',
    rarity: 'legendary',
  },
  {
    id: 'hat_headset',
    category: 'hat',
    nameRu: 'Геймерские Наушники 🎧',
    nameEn: 'Pro Headset 🎧',
    descRu: 'Неоновые игровые наушники с пульсирующей подсветкой.',
    descEn: 'RGB gaming headphones with pulsating lights.',
    price: 150,
    value: 'headset',
    icon: '🎧',
    rarity: 'rare',
  },

  // THRUSTER TRAILS
  {
    id: 'trail_default',
    category: 'trail',
    nameRu: 'Стандартный импульс',
    nameEn: 'Standard Impulse',
    descRu: 'Базовый синий плазменный выхлоп.',
    descEn: 'Default blue plasma thruster trail.',
    price: 0,
    value: 'default',
    icon: '💨',
    rarity: 'common',
  },
  {
    id: 'trail_fire',
    category: 'trail',
    nameRu: 'Пламя Преисподней 🔥',
    nameEn: 'Hellfire Trail 🔥',
    descRu: 'Яростные языки оранжевого и красного пламени.',
    descEn: 'Fierce roaring tongues of blazing orange fire.',
    price: 150,
    value: 'fire',
    icon: '🔥',
    rarity: 'rare',
  },
  {
    id: 'trail_lightning',
    category: 'trail',
    nameRu: 'Электро-Молния ⚡',
    nameEn: 'Lightning Spark ⚡',
    descRu: 'Искрящиеся электрические разряды за соплами.',
    descEn: 'Crackling blue high-voltage lightning discharges.',
    price: 200,
    value: 'lightning',
    icon: '⚡',
    rarity: 'rare',
  },
  {
    id: 'trail_rainbow',
    category: 'trail',
    nameRu: 'Радужная Волна 🌈',
    nameEn: 'Rainbow Wave 🌈',
    descRu: 'Красочный спектральный шлейф всех цветов радуги.',
    descEn: 'Full spectrum rainbow particles flowing in motion.',
    price: 300,
    value: 'rainbow',
    icon: '🌈',
    rarity: 'epic',
  },
  {
    id: 'trail_matrix',
    category: 'trail',
    nameRu: 'Матричный Код 🟩',
    nameEn: 'Matrix Stream 🟩',
    descRu: 'След из падающих зеленых бинарных цифр.',
    descEn: 'Falling green digital glyphs and cyber rain.',
    price: 250,
    value: 'matrix',
    icon: '🟩',
    rarity: 'epic',
  },
  {
    id: 'trail_stars',
    category: 'trail',
    nameRu: 'Звёздная Пыль ✨',
    nameEn: 'Stardust Sparkle ✨',
    descRu: 'Сияющие золотые четырёхконечные звёздочки.',
    descEn: 'Shimmering glittering golden starlight particles.',
    price: 350,
    value: 'stars',
    icon: '✨',
    rarity: 'legendary',
  },

  // TITLES
  {
    id: 'title_rookie',
    category: 'title',
    nameRu: 'Новичок',
    nameEn: 'Rookie',
    descRu: 'Первый титул каждого отважного пилота.',
    descEn: 'Starting rank for every brave recruit.',
    price: 0,
    value: 'rookie',
    icon: '🔰',
    rarity: 'common',
  },
  {
    id: 'title_sniper',
    category: 'title',
    nameRu: 'Снайпер 3000',
    nameEn: 'Sniper 3000',
    descRu: 'Титул для мастеров точной стрельбы из рельсотрона.',
    descEn: 'Title for sharpshooters with railgun precision.',
    price: 100,
    value: 'sniper',
    icon: '🎯',
    rarity: 'rare',
  },
  {
    id: 'title_slayer',
    category: 'title',
    nameRu: 'Гроза Арены',
    nameEn: 'Arena Slayer',
    descRu: 'Тот, кто оставляет за собой лишь обломки врагов.',
    descEn: 'Feared combatant leaving wrecked rivals behind.',
    price: 200,
    value: 'slayer',
    icon: '⚔️',
    rarity: 'rare',
  },
  {
    id: 'title_untouchable',
    category: 'title',
    nameRu: 'Неуязвимый',
    nameEn: 'Untouchable',
    descRu: 'Мастер уклонений, чьи щиты никогда не треснут.',
    descEn: 'Master of turbo dashes whose shields never crack.',
    price: 350,
    value: 'untouchable',
    icon: '🛡️',
    rarity: 'epic',
  },
  {
    id: 'title_legend',
    category: 'title',
    nameRu: '★ КИБЕР-ЛЕГЕНДА ★',
    nameEn: '★ CYBER LEGEND ★',
    descRu: 'Высший титул чемпиона галактической арены!',
    descEn: 'Supreme prestige rank of arena godhood!',
    price: 500,
    value: 'legend',
    icon: '👑',
    rarity: 'legendary',
  },
];

const DEFAULT_COSMETICS: PlayerCosmetics = {
  shipModel: 'phantom',
  hat: 'none',
  trail: 'default',
  title: 'rookie',
};

// Persistence functions
export function getSavedCoins(): number {
  try {
    const raw = localStorage.getItem('cyber_coins');
    if (raw === null) {
      // Starting bonus for new player!
      localStorage.setItem('cyber_coins', '150');
      return 150;
    }
    return Math.max(0, parseInt(raw, 10) || 0);
  } catch {
    return 150;
  }
}

export function saveCoins(amount: number): void {
  try {
    localStorage.setItem('cyber_coins', amount.toString());
  } catch {
    // ignore
  }
}

export function addCoins(reward: number): number {
  const current = getSavedCoins();
  const next = current + reward;
  saveCoins(next);
  return next;
}

export function getUnlockedItemIds(): string[] {
  try {
    const raw = localStorage.getItem('cyber_unlocked_items');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return ['ship_phantom', 'hat_none', 'trail_default', 'title_rookie'];
}

export function unlockItemId(id: string): void {
  const current = getUnlockedItemIds();
  if (!current.includes(id)) {
    current.push(id);
    try {
      localStorage.setItem('cyber_unlocked_items', JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}

export function getEquippedCosmetics(): PlayerCosmetics {
  try {
    const raw = localStorage.getItem('cyber_cosmetics');
    if (raw) {
      return { ...DEFAULT_COSMETICS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_COSMETICS };
}

export function saveEquippedCosmetics(cosmetics: PlayerCosmetics): void {
  try {
    localStorage.setItem('cyber_cosmetics', JSON.stringify(cosmetics));
  } catch {
    // ignore
  }
}
