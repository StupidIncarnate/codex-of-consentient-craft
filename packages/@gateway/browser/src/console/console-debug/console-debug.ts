/**
 * PURPOSE: Writes to the browser console's `debug` channel. `globalThis.console.debug` is read at CALL
 * time, so `consoleDebugProxy()` (which replaces that method after this module loads) records and
 * silences every line. The barrel's `console` capture is the same object, so a caller still writing
 * `console.debug(...)` is recorded by the same proxy.
 *
 * USAGE:
 * consoleDebug('[comment-queue] failed to persist the queue', error);
 * // Returns nothing; the arguments reach console.debug unchanged
 */

export const consoleDebug = (...data: unknown[]): void => {
  globalThis.console.debug(...data);
};
