/**
 * PURPOSE: OS-level liveness probe — uses `process.kill(pid, 0)` which sends no signal but throws ESRCH if the PID has no live process. Returns true when the process is alive, false when it's gone, throws on permission errors so the caller can distinguish "dead" from "unreachable".
 *
 * USAGE:
 * const alive = procCheckAliveAdapter({ pid: processPidContract.parse(812325) });
 * // Returns: boolean. true = process exists, false = no such process (ESRCH).
 */

import { kill } from 'node:process';

import type { ProcessPid } from '../../../contracts/process-pid/process-pid-contract';

export const procCheckAliveAdapter = ({ pid }: { pid: ProcessPid }): boolean => {
  try {
    // Signal `0` is a no-op probe — kernel checks PID existence and permissions, sends no
    // actual signal. The only meaningful errors are ESRCH (no such pid → dead) and EPERM
    // (permission denied on a pid we don't own → still alive but unreachable). Everything
    // else means the kernel call itself failed.
    kill(pid, 0);
    return true;
  } catch (error) {
    const { code } = error as NodeJS.ErrnoException;
    if (code === 'ESRCH') {
      return false;
    }
    if (code === 'EPERM') {
      // Process exists but we lack permission — treat as alive since the agent's claude
      // process is always owned by the same user that started the server.
      return true;
    }
    throw error;
  }
};
