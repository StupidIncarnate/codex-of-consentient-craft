/**
 * PURPOSE: Writes to the browser console's `log` channel. `globalThis.console.log` is read at CALL
 * time, so `consoleLogProxy()` (which replaces that method after this module loads) records and
 * silences every line. The barrel's `console` capture is the same object, so a caller still writing
 * `console.log(...)` is recorded by the same proxy.
 *
 * USAGE:
 * consoleLog('[comment-queue] failed to persist the queue', error);
 * // Returns nothing; the arguments reach console.log unchanged
 */

export const consoleLog = (...data: unknown[]): void => {
  globalThis.console.log(...data);
};
