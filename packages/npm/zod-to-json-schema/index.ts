/**
 * PURPOSE: Pass-through for the npm package 'zod-to-json-schema'. Code outside the gateway imports zod-to-json-schema
 * through here instead of the raw package, so a future guard or override on zod-to-json-schema lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/zod-to-json-schema';
 */

export * from 'zod-to-json-schema';
export { default } from 'zod-to-json-schema';
