/**
 * PURPOSE: Writes to the browser console's `error` channel. `globalThis.console.error` is read at CALL
 * time, so `consoleErrorProxy()` (which replaces that method after this module loads) records and
 * silences every line. The barrel's `console` capture is the same object, so a caller still writing
 * `console.error(...)` is recorded by the same proxy.
 *
 * USAGE:
 * consoleError('[comment-queue] failed to persist the queue', error);
 * // Returns nothing; the arguments reach console.error unchanged
 */

export const consoleError = (...data: unknown[]): void => {
  globalThis.console.error(...data);
};
