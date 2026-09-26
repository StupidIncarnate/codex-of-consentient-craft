/**
 * PURPOSE: Pass-through for the browser global `URL`. Code outside the gateway reaches
 * URL through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { URL } from '@dungeonmaster/browser/URL';
 */

export const { URL } = globalThis;
