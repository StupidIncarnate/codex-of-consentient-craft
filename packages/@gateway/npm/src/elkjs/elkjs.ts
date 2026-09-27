/**
 * PURPOSE: Pass-through for the npm package 'elkjs'. Code outside the gateway imports elkjs
 * through here instead of the raw package, so a future guard or override on elkjs lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/elkjs';
 */

export * from 'elkjs';
export { default } from 'elkjs';
