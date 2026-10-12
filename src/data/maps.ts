import { GameMap } from '../types/game.ts';
import {
  generateAllArenaPresets,
  generateArenaMap,
  ArenaPresetId,
  PRESET_METADATA,
  MapGeneratorOptions,
} from './mapGenerator.ts';

// Generate all canonical presets
const presetMaps = generateAllArenaPresets();

export const MAPS: Record<string, GameMap> = {
  nebula_arena: presetMaps.nebula_arena,
  asteroid_field: presetMaps.asteroid_field,
  orbital_station: presetMaps.orbital_station,
  crystal_expanse: presetMaps.crystal_expanse,
  void_arena: presetMaps.void_arena,
  boss_arena: presetMaps.boss_arena,
};

// Aliases for backward compatibility with previously stored room map IDs
MAPS['neon_grid'] = MAPS['orbital_station'];
MAPS['space_station'] = MAPS['orbital_station'];
MAPS['open_space'] = MAPS['void_arena'];
MAPS['gravity_core'] = MAPS['nebula_arena'];
MAPS['debris_field'] = MAPS['asteroid_field'];
MAPS['wormhole'] = MAPS['crystal_expanse'];

export const ARENA_MAPS: GameMap[] = [
  MAPS.nebula_arena,
  MAPS.asteroid_field,
  MAPS.orbital_station,
  MAPS.crystal_expanse,
  MAPS.void_arena,
];

export {
  generateArenaMap,
  generateAllArenaPresets,
  PRESET_METADATA,
  type ArenaPresetId,
  type MapGeneratorOptions,
};
