/**
 * PURPOSE: Pass-through for the npm package 'minimatch'. Code outside the gateway imports minimatch
 * through here instead of the raw package, so a future guard or override on minimatch lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/minimatch';
 */

export * from 'minimatch';
