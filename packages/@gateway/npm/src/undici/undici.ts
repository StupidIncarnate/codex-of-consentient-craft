/**
 * PURPOSE: Pass-through for the npm package 'undici'. Code outside the gateway imports undici
 * through here instead of the raw package, so a future guard or override on undici lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/undici';
 */

export * from 'undici';
