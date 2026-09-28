/**
 * PURPOSE: Gateway entry for the npm package '@hono/node-server'. Every raw export passes through
 * except `serve`, which this subpath overrides with OUR guarded version — see `./server/server`.
 *
 * USAGE:
 * import { serve } from '#gateway/npm/hono__node-server';
 */

export * from '@hono/node-server';
export { serve } from './server/server';
