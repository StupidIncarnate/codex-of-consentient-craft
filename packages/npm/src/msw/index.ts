/**
 * PURPOSE: Pass-through for the npm package 'msw'. Code outside the gateway imports msw
 * through here instead of the raw package, so a future guard or override on msw lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/msw';
 */

export * from 'msw';
