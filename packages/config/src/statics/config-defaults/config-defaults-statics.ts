/**
 * PURPOSE: Defines default configuration values for dungeonmaster config
 *
 * USAGE:
 * import {configDefaultsStatics} from './config-defaults-statics';
 * const rootFiles = configDefaultsStatics.defaults.allowedRootFiles;
 * // Returns readonly array of default allowed root files
 */

export const configDefaultsStatics = {
  defaults: {
    allowedRootFiles: ['global.d.ts'] as const,
    booleanFunctionPrefixes: ['is', 'has', 'can', 'should', 'will', 'was'] as const,
  },
  orchestration: {
    slotCount: {
      min: 1,
      max: 10,
      default: 3,
    },
    timeoutMs: {
      min: 60000,
      default: 900000,
    },
  },
} as const;
