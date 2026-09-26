/**
 * PURPOSE: Pass-through for the global `setInterval`. Code outside the gateway schedules a
 * repeating timer through here instead of the raw global, so a future guard lands in this one
 * file and reaches every caller.
 *
 * USAGE:
 * import { setInterval } from '@dungeonmaster/node/setInterval';
 */

export const { setInterval } = globalThis;
