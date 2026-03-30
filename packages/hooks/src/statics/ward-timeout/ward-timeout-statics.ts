/**
 * PURPOSE: Minimum timeout for ward commands to prevent SIGTERM from default bash timeout
 *
 * USAGE:
 * import { wardTimeoutStatics } from './ward-timeout-statics';
 * if (timeout < wardTimeoutStatics.minimumTimeout) { ... }
 */

export const wardTimeoutStatics = {
  minimumTimeout: 600_000,
} as const;
