/**
 * PURPOSE: Curated entry for the browser canvas surface. Exposes one draw-and-encode step and
 * nothing raw: a canvas element and its 2D context stay inside the gateway, so callers never touch
 * `HTMLCanvasElement` themselves.
 *
 * USAGE:
 * import { canvasEncode } from '#gateway/browser/HTMLCanvasElement';
 */

export { canvasEncode } from './canvas-encode/canvas-encode';
