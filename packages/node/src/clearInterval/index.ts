/**
 * PURPOSE: Pass-through for the global `clearInterval`. Code outside the gateway cancels a
 * repeating timer through here instead of the raw global, so a future guard lands in this one
 * file and reaches every caller.
 *
 * USAGE:
 * import { clearInterval } from '@dungeonmaster/node/clearInterval';
 */

export const { clearInterval } = globalThis;
