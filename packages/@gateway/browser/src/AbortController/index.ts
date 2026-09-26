/**
 * PURPOSE: Pass-through for the browser global `AbortController`. Code outside the gateway reaches
 * AbortController through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { AbortController } from '@dungeonmaster/browser/AbortController';
 */

export const { AbortController } = globalThis;
