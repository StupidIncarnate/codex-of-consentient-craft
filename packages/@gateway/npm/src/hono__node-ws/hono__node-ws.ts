/**
 * PURPOSE: Gateway entry for the npm package '@hono/node-ws'. Every raw export passes through
 * except `createNodeWebSocket`, which this subpath overrides with OUR guarded version — see
 * `./node-web-socket/node-web-socket`.
 *
 * USAGE:
 * import { createNodeWebSocket } from '#gateway/npm/hono__node-ws';
 */

export * from '@hono/node-ws';
export { createNodeWebSocket } from './node-web-socket/node-web-socket';
