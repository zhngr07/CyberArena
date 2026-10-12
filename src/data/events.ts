import { DynamicEventState, DynamicEventType } from '../types/game.ts';

export interface EventDefinition {
  type: DynamicEventType;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  warningDuration: number; // seconds
  activeDuration: number; // seconds
}

export const DYNAMIC_EVENTS: Record<DynamicEventType, EventDefinition> = {
  // --- ASTEROID FIELD EVENTS ---
  METEOR_SHOWER: {
    type: 'METEOR_SHOWER',
    name: 'Meteor Shower',
    nameRu: 'Астероидный Камнепад',
    description: 'High-velocity burning meteors are crashing into marked hazard zones! Take cover behind rocks!',
    descriptionRu: 'Град тяжелых раскаленных астероидов обрушивается на открытые зоны! Прячьтесь за скалами!',
    warningDuration: 4,
    activeDuration: 14,
  },
  KINETIC_RESONANCE: {
    type: 'KINETIC_RESONANCE',
    name: 'Kinetic Rock Resonance',
    nameRu: 'Кинетический Резонанс Скал',
    description: 'Ancient crags emit kinetic shockwaves: bumper bounces 2.5x stronger, ricochet shots deal +50% damage!',
    descriptionRu: 'Древние скалы излучают кинетическую силу: отскок от камней и бамперов усилен в 2.5 раза, рикошетный урон +50%!',
    warningDuration: 4,
    activeDuration: 13,
  },
  GEODE_BURST: {
    type: 'GEODE_BURST',
    name: 'Mineral Geode Rupture',
    nameRu: 'Разрыв Минеральных Геод',
    description: 'Unstable mineral geodes overload and detonate, launching shrapnel and spawning energy power-ups!',
    descriptionRu: 'Минеральные геоды перегружаются и взрываются, разбрасывая осколки и редкие бустеры!',
    warningDuration: 4,
    activeDuration: 12,
  },

  // --- NEBULA ARENA EVENTS ---
  NEBULA_PLASMA_SURGE: {
    type: 'NEBULA_PLASMA_SURGE',
    name: 'Nebula Plasma Surge',
    nameRu: 'Плазменный Шторм Туманности',
    description: 'Interstellar gas ignites: plasma projectiles gain +40% speed and leave burning trail hazards!',
    descriptionRu: 'Космический газ туманности ионизируется: снаряды ускорены на +40% и оставляют горящий след!',
    warningDuration: 4,
    activeDuration: 13,
  },
  ION_CLOUD_STEALTH: {
    type: 'ION_CLOUD_STEALTH',
    name: 'Ion Gas Cloud Shroud',
    nameRu: 'Ионный Туман Туманности',
    description: 'Dense cosmic clouds obscure radar sensors: dash cooldown resets 2x faster, hull stealth active!',
    descriptionRu: 'Густой космический туман глушит радары: откат рывка ускорен в 2 раза, щиты регенерируют быстрее!',
    warningDuration: 4,
    activeDuration: 12,
  },
  SOLAR_FLARE: {
    type: 'SOLAR_FLARE',
    name: 'Coronal Solar Flare',
    nameRu: 'Солнечная Вспышка',
    description: 'Intense coronal mass ejection temporarily disables energy shields for all vessels!',
    descriptionRu: 'Ионизирующее излучение временно отключает энергощиты! Только чистая прочность корпуса!',
    warningDuration: 4,
    activeDuration: 10,
  },

  // --- ORBITAL STATION EVENTS ---
  ENERGY_OVERLOAD: {
    type: 'ENERGY_OVERLOAD',
    name: 'Station Reactor Overload',
    nameRu: 'Перегрузка Реактора Станции',
    description: 'Platform reactor conduits supercharged: +75% fire rate for all vessels across station corridors!',
    descriptionRu: 'Энергетические цепи станции перегружены: +75% скорострельности у всех орудий в коридорах!',
    warningDuration: 4,
    activeDuration: 11,
  },
  AIRLOCK_DEPRESSURIZATION: {
    type: 'AIRLOCK_DEPRESSURIZATION',
    name: 'Airlock Depressurization',
    nameRu: 'Разгерметизация Шлюзов',
    description: 'Station bulkheads open: heavy vacuum currents pull ships toward outer corridors!',
    descriptionRu: 'Шлюзы станции открыты: мощный вакуумный поток тянет корабли к внешним коридорам!',
    warningDuration: 4,
    activeDuration: 12,
  },
  STATION_SECURITY_GRID: {
    type: 'STATION_SECURITY_GRID',
    name: 'Security Laser Grid',
    nameRu: 'Охранный Лазерный Периметр',
    description: 'Automated defense grids online: sweeping security lasers traverse station arterial lanes!',
    descriptionRu: 'Активированы охранные лазеры станции: сканирующие лучи безопасности пересекают коридоры!',
    warningDuration: 4,
    activeDuration: 13,
  },

  // --- CRYSTAL EXPANSE EVENTS ---
  WORMHOLE_SURGE: {
    type: 'WORMHOLE_SURGE',
    name: 'Wormhole Quantum Surge',
    nameRu: 'Квантовый Всплеск Червоточин',
    description: 'Dimensional wormhole tears expand: instant portal jump cooldown and extra quantum rifts open!',
    descriptionRu: 'Квантовые порталы перегружены: телепортация мгновенная, открываются дополнительные червоточины!',
    warningDuration: 4,
    activeDuration: 14,
  },
  CRYSTAL_PRISM_BURST: {
    type: 'CRYSTAL_PRISM_BURST',
    name: 'Prismatic Crystal Refraction',
    nameRu: 'Призматическое Преломление',
    description: 'Alien crystal monoliths refract energy: shots hitting crystal barriers shatter into radiant bursts!',
    descriptionRu: 'Инопланетные кристаллы преломляют выстрелы: лучи и лазеры рассеиваются веером во все стороны!',
    warningDuration: 4,
    activeDuration: 12,
  },
  CRYSTALLINE_REGENERATION: {
    type: 'CRYSTALLINE_REGENERATION',
    name: 'Crystalline Resonance Field',
    nameRu: 'Кристаллический Резонанс',
    description: 'Crystals radiate restorative aura: vessels near crystal monoliths rapidly repair hull and shields!',
    descriptionRu: 'Кристаллы излучают целебную ауру: корабли возле монолитов быстро восстанавливают корпус и щиты!',
    warningDuration: 4,
    activeDuration: 12,
  },

  // --- VOID ARENA EVENTS ---
  SINGULARITY_COLLAPSE: {
    type: 'SINGULARITY_COLLAPSE',
    name: 'Singularity Gravitational Collapse',
    nameRu: 'Гравитационный Коллапс Сингулярности',
    description: 'Central micro-singularity pulsates violently: 2.5x gravitational pull warping all flight vectors!',
    descriptionRu: 'Центральная черная дыра пульсирует: притяжение утроено, искривляя траектории кораблей и снарядов!',
    warningDuration: 4,
    activeDuration: 12,
  },
  BLACKOUT: {
    type: 'BLACKOUT',
    name: 'Deep Space Void Eclipse',
    nameRu: 'Затмение Пустоты',
    description: 'Radar and sensors blackout in the deep void. Only stark neon contours visible — stealth combat!',
    descriptionRu: 'Сенсоры и радары отключены. Арена погружается во тьму — светятся лишь неоновые контуры!',
    warningDuration: 4,
    activeDuration: 12,
  },
  ANTIMATTER_PULSE: {
    type: 'ANTIMATTER_PULSE',
    name: 'Antimatter Shockwave Pulse',
    nameRu: 'Антиматериальная Волна',
    description: 'Expanding antimatter rings radiate from the abyss! Break line-of-sight behind monolithic pillars!',
    descriptionRu: 'Из пустоты исходят волны антиматерии! Прячьтесь за монолитами, чтобы избежать урона!',
    warningDuration: 4,
    activeDuration: 11,
  },

  // --- TITAN VOID SECTOR (BOSS RAID) ---
  ORBITAL_BOMBARDMENT: {
    type: 'ORBITAL_BOMBARDMENT',
    name: 'Titan Orbital Barrage',
    nameRu: 'Орбитальный Залп Титана',
    description: 'Titan commands a carpet laser strike across the arena! Seek cover behind defensive pylons!',
    descriptionRu: 'Титан вызывает разрушительный орбитальный лазерный залп! Укрывайтесь за пилонами!',
    warningDuration: 4,
    activeDuration: 13,
  },
  DARK_MATTER_PULSE: {
    type: 'DARK_MATTER_PULSE',
    name: 'Dark Matter EMP Pulse',
    nameRu: 'Импульс Тёмной Материи',
    description: 'Dark matter wave disrupts all shields and decelerates minions and vessels!',
    descriptionRu: 'Тёмная энергия дестабилизирует щиты кораблей и миньонов!',
    warningDuration: 4,
    activeDuration: 10,
  },

  // Legacy fallback
  GRAVITY_STORM: {
    type: 'GRAVITY_STORM',
    name: 'Gravity Storm',
    nameRu: 'Гравитационный Шторм',
    description: 'Gravitational shockwaves distort vessel vectors across the entire sector!',
    descriptionRu: 'Гравитационные аномалии раскачивают корабли и искривляют траектории снарядов!',
    warningDuration: 4,
    activeDuration: 12,
  },
};

export const MAP_SPECIFIC_EVENTS: Record<string, DynamicEventType[]> = {
  nebula_arena: ['NEBULA_PLASMA_SURGE', 'ION_CLOUD_STEALTH', 'SOLAR_FLARE'],
  asteroid_field: ['METEOR_SHOWER', 'KINETIC_RESONANCE', 'GEODE_BURST'],
  orbital_station: ['ENERGY_OVERLOAD', 'AIRLOCK_DEPRESSURIZATION', 'STATION_SECURITY_GRID'],
  crystal_expanse: ['WORMHOLE_SURGE', 'CRYSTAL_PRISM_BURST', 'CRYSTALLINE_REGENERATION'],
  void_arena: ['SINGULARITY_COLLAPSE', 'BLACKOUT', 'ANTIMATTER_PULSE'],
  boss_arena: ['ORBITAL_BOMBARDMENT', 'DARK_MATTER_PULSE', 'ENERGY_OVERLOAD'],
};

export const EVENT_TYPES: DynamicEventType[] = Object.keys(DYNAMIC_EVENTS) as DynamicEventType[];
