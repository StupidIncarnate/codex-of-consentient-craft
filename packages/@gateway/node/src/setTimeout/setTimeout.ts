/**
 * PURPOSE: Pass-through for the global `setTimeout`. Code outside the gateway schedules a
 * timer through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { setTimeout } from '#gateway/node/setTimeout';
 */

export const { setTimeout } = globalThis;
