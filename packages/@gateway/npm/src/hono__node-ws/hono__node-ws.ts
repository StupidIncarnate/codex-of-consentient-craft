/**
 * PURPOSE: Pass-through for the npm package '@hono/node-ws'. Code outside the gateway imports @hono/node-ws
 * through here instead of the raw package, so a future guard or override on @hono/node-ws lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/hono__node-ws';
 */

export * from '@hono/node-ws';
