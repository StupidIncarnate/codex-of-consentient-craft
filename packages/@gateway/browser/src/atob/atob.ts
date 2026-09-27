/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `atob`. Code outside the gateway reaches
 * atob through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { atob } from '#gateway/browser/atob';
 */

export const { atob } = globalThis;
