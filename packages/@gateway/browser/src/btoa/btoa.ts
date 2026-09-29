/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `btoa`. Code outside the gateway reaches
 * btoa through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { btoa } from '#gateway/browser/btoa';
 */

export const { btoa } = globalThis;
