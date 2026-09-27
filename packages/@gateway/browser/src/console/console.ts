/**
 * PURPOSE: Pass-through for the browser global `console`. Code outside the gateway reaches
 * console through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { console } from '#gateway/browser/console';
 */

export const { console } = globalThis;
