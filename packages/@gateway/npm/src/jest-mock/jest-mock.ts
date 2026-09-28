/**
 * PURPOSE: Pass-through for the npm package 'jest-mock'. Code outside the gateway imports jest-mock
 * through here instead of the raw package, so a future guard or override on jest-mock lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/jest-mock';
 */

export * from 'jest-mock';
