/**
 * PURPOSE: Writes to the browser console's `warn` channel. `globalThis.console.warn` is read at CALL
 * time, so `consoleWarnProxy()` (which replaces that method after this module loads) records and
 * silences every line. The barrel's `console` capture is the same object, so a caller still writing
 * `console.warn(...)` is recorded by the same proxy.
 *
 * USAGE:
 * consoleWarn('[comment-queue] failed to persist the queue', error);
 * // Returns nothing; the arguments reach console.warn unchanged
 */

export const consoleWarn = (...data: unknown[]): void => {
  globalThis.console.warn(...data);
};
