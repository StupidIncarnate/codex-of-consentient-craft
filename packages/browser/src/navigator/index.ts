/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `navigator`. Code outside the gateway reaches
 * navigator through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { navigator } from '@dungeonmaster/browser/navigator';
 */

export const { navigator } = globalThis;
