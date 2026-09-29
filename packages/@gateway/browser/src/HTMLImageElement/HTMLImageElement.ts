/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `HTMLImageElement`. Code outside the gateway reaches
 * HTMLImageElement through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { HTMLImageElement } from '#gateway/browser/HTMLImageElement';
 */

export const { HTMLImageElement } = globalThis;
