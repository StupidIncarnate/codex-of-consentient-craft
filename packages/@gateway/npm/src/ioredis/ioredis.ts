/**
 * PURPOSE: Pass-through for the npm package 'ioredis'. Code outside the gateway imports ioredis
 * through here instead of the raw package, so a future guard or override on ioredis lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/ioredis';
 */

export * from 'ioredis';
export { default } from 'ioredis';
