/**
 * PURPOSE: Pass-through for the npm package '@hono/node-server'. Code outside the gateway imports @hono/node-server
 * through here instead of the raw package, so a future guard or override on @hono/node-server lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@hono/node-server';
 */

export * from '@hono/node-server';
