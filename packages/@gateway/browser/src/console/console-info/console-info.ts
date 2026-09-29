/**
 * PURPOSE: Writes to the browser console's `info` channel. `globalThis.console.info` is read at CALL
 * time, so `consoleInfoProxy()` (which replaces that method after this module loads) records and
 * silences every line. The barrel's `console` capture is the same object, so a caller still writing
 * `console.info(...)` is recorded by the same proxy.
 *
 * USAGE:
 * consoleInfo('[comment-queue] failed to persist the queue', error);
 * // Returns nothing; the arguments reach console.info unchanged
 */

export const consoleInfo = (...data: unknown[]): void => {
  globalThis.console.info(...data);
};
