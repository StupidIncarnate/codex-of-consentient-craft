/**
 * PURPOSE: Pass-through for the npm package 'pngjs'. Code outside the gateway imports pngjs
 * through here instead of the raw package, so a future guard or override on pngjs lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/pngjs';
 */

export * from 'pngjs';
