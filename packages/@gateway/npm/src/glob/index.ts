/**
 * PURPOSE: Gateway entry for the npm package 'glob'. Every export passes through except `glob`
 * itself, which this subpath overrides with OUR guarded version — see `./glob`.
 *
 * USAGE:
 * import { glob } from '@dungeonmaster/npm/glob';
 */

export * from 'glob';
export { glob } from './glob';
