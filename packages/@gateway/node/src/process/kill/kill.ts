/**
 * PURPOSE: Sends a signal to a process by pid. Keeps `process.kill`'s own positional
 * shape since the wrapper keeps the outside function's name.
 *
 * USAGE:
 * kill(1234, 'SIGTERM');
 * // Returns true, the same as process.kill() does
 */

export const kill = (targetPid: number, signal?: NodeJS.Signals | number): true =>
  process.kill(targetPid, signal);
