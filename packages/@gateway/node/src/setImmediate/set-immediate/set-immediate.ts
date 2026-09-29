/**
 * PURPOSE: Schedules a callback for the check phase of the event loop, after pending I/O
 * callbacks. Reads `globalThis.setImmediate` when called, so fake timers installed later and the
 * proxy's spy are both honoured. Tests use it to let queued I/O callbacks and promise chains settle.
 *
 * The parameter list mirrors Node's own two overloads, so `setImmediate(resolve)` compiles where
 * `resolve` is a Promise executor's `(value: void | PromiseLike<void>) => void`.
 *
 * USAGE:
 * await new Promise<void>((resolve) => {
 *   setImmediate(() => resolve());
 * });
 * // Resolves once the current loop turn's I/O callbacks have run
 */

export const setImmediate = <TArgs extends unknown[]>(
  ...params:
    [callback: (arg: undefined) => void] | [callback: (...args: TArgs) => void, ...args: TArgs]
): NodeJS.Immediate => {
  const [callback, ...args] = params;
  return globalThis.setImmediate(callback as (...rest: unknown[]) => void, ...args);
};
