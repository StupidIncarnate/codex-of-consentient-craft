/**
 * PURPOSE: Registers a signal handler on the process. Keeps `process.on`'s own positional
 * shape since the wrapper keeps the outside function's name.
 *
 * USAGE:
 * on('SIGINT', () => cleanup());
 * // Returns the same process object process.on() does
 */

export const on = (signal: NodeJS.Signals, handler: () => void): NodeJS.Process =>
  process.on(signal, handler);
