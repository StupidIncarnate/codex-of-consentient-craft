/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `requestAnimationFrame`. Code outside the gateway reaches
 * requestAnimationFrame through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { requestAnimationFrame } from '#gateway/browser/requestAnimationFrame';
 */

export const { requestAnimationFrame } = globalThis;
