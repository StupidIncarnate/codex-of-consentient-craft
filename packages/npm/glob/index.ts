/**
 * PURPOSE: Pass-through for the npm package 'glob'. Code outside the gateway imports glob
 * through here instead of the raw package, so a future guard or override on glob lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/glob';
 */

export * from 'glob';
