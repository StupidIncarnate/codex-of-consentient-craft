/**
 * PURPOSE: The recursive idle-or-kill wait a driver's serve loop blocks on — resolves `true` the
 * instant `killSignal` settles (a socket `kill` or an OS signal tore the lane down already), `false`
 * once `driverSessionState`'s last-activity deadline passes with nothing pushing it forward. Deadline
 * recursion, never `while (true)` — `siege-driver.ts`'s own `pump` (lines 153-171) is the shape this
 * generalises from polling a commands directory to racing a promise against a real socket's traffic,
 * recomputing the deadline fresh on every wake so activity that landed mid-sleep extends the wait
 * rather than being missed. A LAYER file, not folded into its parent: recursion needs a name to call
 * itself by, and a named function bound inside another function is a forbidden nested declaration —
 * this file's own top-level export is that name.
 *
 * USAGE:
 * const wasKilled = await DriverIdleWaitLayerResponder({ killSignal: killSignalPromise });
 * // Resolves false once driverSessionState's idle window elapses with no traffic in between
 */

import { driverSessionState } from '../../../state/driver-session/driver-session-state';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const DriverIdleWaitLayerResponder = async ({
  killSignal,
}: {
  killSignal: Promise<true>;
}): Promise<boolean> => {
  if (driverSessionState.lane() === null) {
    return true;
  }

  const deadlineMs = driverSessionState.lastActivityMs() + driverStatics.idle.timeoutMs;
  const nowMs = Date.now();

  if (nowMs >= deadlineMs) {
    return false;
  }

  const sleep = new Promise<false>((resolve) => {
    setTimeout(() => {
      resolve(false);
    }, deadlineMs - nowMs);
  });

  const outcome = await Promise.race([sleep, killSignal]);

  if (outcome) {
    return true;
  }

  return DriverIdleWaitLayerResponder({ killSignal });
};
