/**
 * PURPOSE: Pass-through for the global `AbortController`. Code outside
 * the gateway builds an abort signal through here instead of the raw global, so a future guard
 * lands in this one file and reaches every caller.
 *
 * USAGE:
 * import { AbortController } from '#gateway/node/AbortController';
 * const controller = new AbortController();
 */

export const { AbortController } = globalThis;
