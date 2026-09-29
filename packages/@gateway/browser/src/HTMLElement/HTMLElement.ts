/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `HTMLElement`. Code outside the gateway reaches
 * HTMLElement through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { HTMLElement } from '#gateway/browser/HTMLElement';
 */

export const { HTMLElement } = globalThis;
