/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `location`. Code outside the gateway reaches
 * location through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { location } from '@dungeonmaster/browser/location';
 */

export const { location } = globalThis;
