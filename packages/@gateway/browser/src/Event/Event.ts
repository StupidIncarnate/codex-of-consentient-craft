/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `Event`. Code outside the gateway reaches
 * Event through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { Event } from '#gateway/browser/Event';
 */

export const { Event } = globalThis;
