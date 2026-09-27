/**
 * PURPOSE: Pass-through for the global `console`. Code outside the gateway reaches console
 * through here instead of the raw global, so a future guard or a shared logger lands in this
 * one file and reaches every caller.
 *
 * USAGE:
 * import { console } from '#gateway/node/console';
 */

export const { console } = globalThis;
