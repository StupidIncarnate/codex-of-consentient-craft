/**
 * PURPOSE: Gateway entry for the npm package 'pngjs'. Every raw export passes through; `decodePng`
 * is OUR guarded decode — a new name because its shape (plain Buffer in, plain object out,
 * errors wrapped with cause) is not the raw `PNG.sync.read()` call it replaces.
 *
 * USAGE:
 * import { decodePng } from '@dungeonmaster/npm/pngjs';
 */

export * from 'pngjs';
export { decodePng } from './decode-png';
