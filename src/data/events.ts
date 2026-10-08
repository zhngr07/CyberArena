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
  METEOR_SHOWER: {
    type: 'METEOR_SHOWER',
    name: 'Meteor Shower',
    nameRu: 'Метеоритный Дождь',
    description: 'High-velocity burning meteors are crashing into marked hazard zones!',
    descriptionRu: 'Пылающие метеоры обрушиваются на отмеченные зоны арены! Покиньте красные секторы!',
    warningDuration: 5,
    activeDuration: 14,
  },
  GRAVITY_STORM: {
    type: 'GRAVITY_STORM',
    name: 'Gravity Storm',
    nameRu: 'Гравитационный Шторм',
    description: 'Gravitational shockwaves distort vessel vectors across the entire sector!',
    descriptionRu: 'Гравитационные аномалии раскачивают корабли и искривляют траектории снарядов!',
    warningDuration: 5,
    activeDuration: 12,
  },
  SOLAR_FLARE: {
    type: 'SOLAR_FLARE',
    name: 'Solar Flare',
    nameRu: 'Солнечная Вспышка',
    description: 'Intense coronal mass ejection temporarily disables energy shields!',
    descriptionRu: 'Ионизирующее излучение временно отключает энергощиты! Только чистый корпус!',
    warningDuration: 5,
    activeDuration: 10,
  },
  BLACKOUT: {
    type: 'BLACKOUT',
    name: 'Subspace Blackout',
    nameRu: 'Затмение Подпространства',
    description: 'Radar and sensors blackout. Stealth dogfighting initiated!',
    descriptionRu: 'Сенсоры и радары отключены. Арена погружается во тьму — действуйте скрытно!',
    warningDuration: 5,
    activeDuration: 12,
  },
  WORMHOLE_SURGE: {
    type: 'WORMHOLE_SURGE',
    name: 'Wormhole Surge',
    nameRu: 'Квантовый Всплеск',
    description: 'Unstable dimensional tears emerge across the arena floor!',
    descriptionRu: 'Нестабильные квантовые червоточины открываются по всей арене!',
    warningDuration: 5,
    activeDuration: 14,
  },
  ENERGY_OVERLOAD: {
    type: 'ENERGY_OVERLOAD',
    name: 'Reactor Overload',
    nameRu: 'Перегрузка Реакторов',
    description: 'All weapon energy conduits supercharged: +75% fire rate for all pilots!',
    descriptionRu: 'Энергетические цепи перегружены: +75% скорострельности у всех кораблей!',
    warningDuration: 5,
    activeDuration: 10,
  },
};

export const EVENT_TYPES: DynamicEventType[] = [
  'METEOR_SHOWER',
  'GRAVITY_STORM',
  'SOLAR_FLARE',
  'BLACKOUT',
  'WORMHOLE_SURGE',
  'ENERGY_OVERLOAD',
];
