/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `Blob`. Code outside the gateway reaches
 * Blob through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { Blob } from '@dungeonmaster/browser/Blob';
 */

export const { Blob } = globalThis;
