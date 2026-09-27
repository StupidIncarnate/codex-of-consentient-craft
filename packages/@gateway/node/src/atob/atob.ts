/**
 * PURPOSE: Pass-through for the global `atob`. Code outside the gateway decodes base64 through
 * here instead of the raw global, so a future guard lands in this one file and reaches every
 * caller.
 *
 * USAGE:
 * import { atob } from '#gateway/node/atob';
 */

export const { atob } = globalThis;
