/**
 * PURPOSE: Pass-through for the npm package 'zod'. Code outside the gateway imports zod
 * through here instead of the raw package, so a future guard or override on zod lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/zod';
 */

export * from 'zod';
export { default } from 'zod';
