/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `Node`. Code outside the gateway reaches
 * Node through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { Node } from '#gateway/browser/Node';
 */

export const { Node } = globalThis;
