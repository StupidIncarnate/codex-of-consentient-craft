/**
 * PURPOSE: Sends ONE signal to a whole process GROUP by negating its pgid — `process.kill(-pgid,
 * signal)` — because `detached: true` at spawn time made the group's leader its own session leader,
 * so the negated pgid is the only target that reaches a wrapper's grandchild (`npm run` → `sh -c` →
 * the real listener; killing the pid alone leaves that listener holding the port). Catches ESRCH and
 * reports it on `signalSent` instead of throwing: a pgid whose process already exited is the outcome
 * a teardown pass is ASKING for, not a failure, and a caller escalating SIGTERM → SIGKILL needs to
 * know the signal never landed without every clean teardown logging a thrown error. Any other
 * failure (EPERM, an unknown signal name) is a real one and propagates.
 *
 * USAGE:
 * processKillGroupAdapter({ pgid: ProcessGroupIdStub({ value: 4821 }), signal: 'SIGTERM' });
 * // Live group: sends the signal, returns { success: true, signalSent: true }
 * // Group already gone: returns { success: true, signalSent: false } without throwing
 */

import { kill } from 'node:process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';

export const processKillGroupAdapter = ({
  pgid,
  signal,
}: {
  pgid: ProcessGroupId;
  signal: string;
}): AdapterResult & { signalSent: boolean } => {
  try {
    kill(-Number(pgid), signal);
    return { success: true as const, signalSent: true };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
      return { success: true as const, signalSent: false };
    }
    throw error;
  }
};
