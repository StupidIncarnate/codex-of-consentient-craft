/**
 * PURPOSE: Pass-through for the npm package 'hono/ws'. Code outside the gateway imports hono/ws
 * through here instead of the raw package, so a future guard or override on hono/ws lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { WSContext } from '#gateway/npm/hono__ws';
 */

export * from 'hono/ws';
