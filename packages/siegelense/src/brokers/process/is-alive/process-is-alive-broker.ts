/**
 * PURPOSE: Probes whether a whole process GROUP is still alive via `kill(-pgid, 0)` — signal
 * `0` is the POSIX no-op the kernel answers from PID-table membership alone, so this never actually
 * delivers a signal to the tree. This is what lets a SIGKILL pass skip a group a SIGTERM already
 * reaped instead of firing a second real signal that would only log `kill ESRCH` on every clean
 * teardown, and it is what a reaper reads for a pgid recovered off a heartbeat file: after a SIGKILL
 * nothing in memory still holds the pgids it named, so this probe is the only way to tell a live
 * orphan apart from a stale record.
 *
 * USAGE:
 * processIsAliveBroker({ pgid: ProcessGroupIdStub({ value: 4821 }) });
 * // Live group: true
 * // Group already exited (ESRCH): false
 */

import { isFsError } from '#gateway/node/fs';
import { kill } from '#gateway/node/process';

const PROBE_SIGNAL = 0;

export const processIsAliveBroker = ({ pgid }: { pgid: number }): boolean => {
  try {
    kill(-pgid, PROBE_SIGNAL);
    return true;
  } catch (error: unknown) {
    // `isFsError` reads `.code` off any object rather than checking `instanceof Error`: a real ESRCH
    // is built by Node's internals outside the vm realm a Jest test file runs in.
    if (isFsError({ error, code: 'ESRCH' })) {
      return false;
    }
    throw error;
  }
};
