/**
 * PURPOSE: Sends ONE signal to a whole process GROUP by negating its pgid — `kill(-pgid,
 * signal)` — because `detached: true` at spawn time made the group's leader its own session leader,
 * so the negated pgid is the only target that reaches a wrapper's grandchild (`npm run` → `sh -c` →
 * the real listener; killing the pid alone leaves that listener holding the port). Catches ESRCH and
 * reports it on `signalSent` instead of throwing: a pgid whose process already exited is the outcome
 * a teardown pass is ASKING for, not a failure, and a caller escalating SIGTERM → SIGKILL needs to
 * know the signal never landed without every clean teardown logging a thrown error. Any other
 * failure (EPERM, an unknown signal name) is a real one and propagates.
 *
 * USAGE:
 * processKillGroupBroker({ pgid: ProcessGroupIdStub({ value: 4821 }), signal: 'SIGTERM' });
 * // Live group: sends the signal, returns { signalSent: true }
 * // Group already gone: returns { signalSent: false } without throwing
 */

import { isFsError } from '#gateway/node/fs';
import { kill } from '#gateway/node/process';


export const processKillGroupBroker = ({
  pgid,
  signal,
}: {
  pgid: number;
  signal: NodeJS.Signals;
}): { signalSent: boolean } => {
  try {
    kill(-Number(pgid), signal);
    return { signalSent: true };
  } catch (error: unknown) {
    // `isFsError` reads `.code` off any object rather than checking `instanceof Error`: a real ESRCH
    // is built by Node's internals outside the vm realm a Jest test file runs in.
    if (isFsError({ error, code: 'ESRCH' })) {
      return { signalSent: false };
    }
    throw error;
  }
};
