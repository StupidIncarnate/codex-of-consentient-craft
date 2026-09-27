/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `document`. Code outside the gateway reaches
 * document through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { document } from '#gateway/browser/document';
 */

export const { document } = globalThis;
