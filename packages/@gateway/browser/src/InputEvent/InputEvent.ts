/// <reference lib="dom" />
/**
 * PURPOSE: Pass-through for the browser global `InputEvent`. Code outside the gateway reaches
 * InputEvent through here instead of the raw global, so a future guard lands in this one file and
 * reaches every caller.
 *
 * USAGE:
 * import { InputEvent } from '#gateway/browser/InputEvent';
 */

export const { InputEvent } = globalThis;
