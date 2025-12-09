/**
 * PURPOSE: Validates if an unknown value is a DungeonmasterHooksConfig object
 *
 * USAGE:
 * const config: unknown = require('./config.js');
 * if (isDungeonmasterHooksConfigGuard(config)) {
 *   // config is DungeonmasterHooksConfig
 * }
 * // Returns true if value has preEditLint property
 */
import type { DungeonmasterHooksConfig } from '../../contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config-contract';

export const isDungeonmasterHooksConfigGuard = (
  value: unknown,
): value is DungeonmasterHooksConfig =>
  typeof value === 'object' && value !== null && 'preEditLint' in value;
