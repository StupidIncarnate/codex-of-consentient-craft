/**
 * PURPOSE: OS-level liveness probe — sends signal `0` (no signal is delivered; the kernel only
 * checks the pid exists and is addressable). Returns true when the process is alive, false when
 * it is gone, and throws on any other failure so a caller can tell "dead" from "unreachable".
 * Reach for this over `kill` from `#gateway/node/process` whenever the question is "is this pid
 * still running" — the ESRCH/EPERM reading lives here once.
 *
 * USAGE:
 * const alive = processIsAliveBroker({ pid: 812325 });
 * // Returns true when the process exists, false on ESRCH.
 */

import { isFsError } from '#gateway/node/fs';
import { kill } from '#gateway/node/process';

const PROBE_SIGNAL = 0;

export const processIsAliveBroker = ({ pid }: { pid: number }): boolean => {
  try {
    kill(pid, PROBE_SIGNAL);
    return true;
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ESRCH' })) {
      return false;
    }
    // EPERM: the process exists but is owned by someone else. An agent's claude process is always
    // owned by the user that started the server, so this reads as alive-but-unreachable.
    if (isFsError({ error, code: 'EPERM' })) {
      return true;
    }
    throw error;
  }
};
