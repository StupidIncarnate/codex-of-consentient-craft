/// <reference lib="dom" />
/**
 * PURPOSE: Cancels an interval through the browser global `clearInterval`. The global is read at
 * CALL time, so a spy or fake-timer install after this module loads still sees the call.
 *
 * USAGE:
 * clearInterval(handle);
 */

export const clearInterval = (handle: Parameters<typeof globalThis.clearInterval>[0]): void => {
  globalThis.clearInterval(handle);
};
