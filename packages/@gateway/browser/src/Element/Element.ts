/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `Element`. Code outside the gateway reaches
 * Element through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { Element } from '#gateway/browser/Element';
 */

export const { Element } = globalThis;
