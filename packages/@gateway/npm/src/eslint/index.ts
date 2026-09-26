/**
 * PURPOSE: Pass-through for the npm package 'eslint'. Code outside the gateway imports eslint
 * through here instead of the raw package, so a future guard or override on eslint lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/eslint';
 */

export * from 'eslint';
