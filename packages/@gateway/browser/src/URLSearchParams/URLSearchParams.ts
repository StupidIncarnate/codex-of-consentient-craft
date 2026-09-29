/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `URLSearchParams`. Code outside the gateway reaches
 * URLSearchParams through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { URLSearchParams } from '#gateway/browser/URLSearchParams';
 */

export const { URLSearchParams } = globalThis;
