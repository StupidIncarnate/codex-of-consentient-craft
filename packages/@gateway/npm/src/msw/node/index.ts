/**
 * PURPOSE: Pass-through for the npm package 'msw/node'. Code outside the gateway imports msw/node
 * through here instead of the raw package, so a future guard or override on msw/node lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/msw/node';
 */

export * from 'msw/node';
