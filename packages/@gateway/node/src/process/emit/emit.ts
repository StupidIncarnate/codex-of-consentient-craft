/**
 * PURPOSE: Emits an event on the process, running every handler registered for it. Returns
 * whether anyone was listening, exactly as `process.emit` does.
 *
 * USAGE:
 * const heard = emit('SIGTERM');
 * // true when at least one SIGTERM handler ran
 */

export const emit = (event: string | symbol, ...args: unknown[]): boolean => {
  // Typed as the plain emitter: `Process` only declares `emit` for its known signal and lifecycle
  // names, and this wrapper takes any event name.
  const emitter: NodeJS.EventEmitter = process;
  return emitter.emit(event, ...args);
};
