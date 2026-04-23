/**
 * PURPOSE: Sends a signal (or a 0-signal liveness probe) to a PID via process.kill
 *
 * USAGE:
 * const alive = processSignalAdapter({ pid, signal: 0 });
 * // Returns: true if the PID exists (process.kill did not throw), false if ESRCH was raised.
 *
 * WHEN-TO-USE: Smoketest teardown verification needs to confirm a dev-server child process fully exited.
 * signal=0 is the POSIX no-op probe — process.kill throws ESRCH when the pid is gone and returns normally when
 * the pid is still addressable (even if the signal itself is ignored).
 * WHEN-NOT-TO-USE: Anywhere you actually want to terminate a process — use processKillByPortAdapter or a spawn-
 * owned kill handle instead.
 */

import type { ProcessPid } from '../../../contracts/process-pid/process-pid-contract';

export const processSignalAdapter = ({
  pid,
  signal,
}: {
  pid: ProcessPid;
  signal: number;
}): boolean => {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
};
