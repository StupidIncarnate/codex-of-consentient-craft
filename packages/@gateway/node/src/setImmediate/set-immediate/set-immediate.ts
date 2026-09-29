/**
 * PURPOSE: Schedules a callback for the check phase of the event loop, after pending I/O
 * callbacks. Reads `globalThis.setImmediate` when called, so fake timers installed later and the
 * proxy's spy are both honoured. Tests use it to let queued I/O callbacks and promise chains settle.
 *
 * USAGE:
 * await new Promise<void>((resolve) => {
 *   setImmediate(() => resolve());
 * });
 * // Resolves once the current loop turn's I/O callbacks have run
 */

export const setImmediate = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  ...args: TArgs
): NodeJS.Immediate => globalThis.setImmediate(callback, ...args);
