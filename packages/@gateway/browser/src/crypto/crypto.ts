/**
 * PURPOSE: Pass-through for the browser global `crypto`. Code outside the gateway reaches
 * crypto through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { crypto } from '#gateway/browser/crypto';
 */

export const { crypto } = globalThis;
