/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `createImageBitmap`. Code outside the gateway reaches
 * createImageBitmap through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { createImageBitmap } from '#gateway/browser/createImageBitmap';
 */

export const { createImageBitmap } = globalThis;
