/**
 * PURPOSE: Registers a handler for a process event — a signal (`SIGINT`, `SIGTERM`) or any other
 * event the process emits (`exit`, `uncaughtException`, `unhandledRejection`, a custom name).
 * Keeps `process.on`'s own positional shape since the wrapper keeps the outside function's name.
 * The handler takes whatever arguments that event carries.
 *
 * USAGE:
 * on('SIGINT', () => cleanup());
 * on('exit', (code: number) => report(code));
 * // Returns the same process object process.on() does
 */

export const on = (event: string | symbol, handler: (...args: never[]) => void): NodeJS.Process => {
  // Typed as the plain emitter: `Process` only declares `on` for its known signal and lifecycle
  // names, and this wrapper takes any event name.
  const emitter: NodeJS.EventEmitter = process;
  // `never[]` accepts a handler of any argument list; the emitter's own `any[]` parameter cannot
  // take it without the cast.
  emitter.on(event, handler as never);
  return process;
};
