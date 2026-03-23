/**
 * PURPOSE: Defines patterns and banned imports for harness file enforcement
 *
 * USAGE:
 * import { harnessPatternsStatics } from './statics/harness-patterns/harness-patterns-statics';
 * const isBanned = harnessPatternsStatics.bannedNodeBuiltins.includes('fs');
 * // Returns true
 *
 * WHEN-TO-USE: When validating imports in test scenario files or enforcing harness patterns
 */
export const harnessPatternsStatics = {
  bannedNodeBuiltins: [
    'fs',
    'fs/promises',
    'path',
    'os',
    'crypto',
    'child_process',
    'node:fs',
    'node:fs/promises',
    'node:path',
    'node:os',
    'node:crypto',
    'node:child_process',
  ],
} as const;
