/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `window`. Code outside the gateway reaches
 * window through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { window } from '#gateway/browser/window';
 */

export const { window } = globalThis;
