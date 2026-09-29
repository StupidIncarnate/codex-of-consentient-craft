/// <reference lib="dom" />
/**
 * PURPOSE: Cancels a timeout through the browser global `clearTimeout`. The global is read at CALL
 * time, so a spy or fake-timer install after this module loads still sees the call.
 *
 * USAGE:
 * clearTimeout(handle);
 */

export const clearTimeout = (handle: Parameters<typeof globalThis.clearTimeout>[0]): void => {
  globalThis.clearTimeout(handle);
};
