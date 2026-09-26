/**
 * PURPOSE: Pass-through for the npm package 'hono/utils/http-status'. Code outside the gateway imports hono/utils/http-status
 * through here instead of the raw package, so a future guard or override on hono/utils/http-status lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/hono/utils/http-status';
 */

export type * from 'hono/utils/http-status';
