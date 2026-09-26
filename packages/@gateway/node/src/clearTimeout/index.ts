/**
 * PURPOSE: Pass-through for the global `clearTimeout`. Code outside the gateway cancels a timer
 * through here instead of the raw global, so a future guard lands in this one file and reaches
 * every caller.
 *
 * USAGE:
 * import { clearTimeout } from '@dungeonmaster/node/clearTimeout';
 */

export const { clearTimeout } = globalThis;
