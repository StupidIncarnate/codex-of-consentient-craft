/**
 * PURPOSE: The recursive idle-or-kill wait a driver's serve loop blocks on — resolves `true` the
 * instant `killSignal` settles (a socket `kill` or an OS signal tore the lane down already), `false`
 * once `driverSessionState`'s last-activity deadline passes with nothing pushing it forward. Deadline
 * recursion, never `while (true)` — `siege-driver.ts`'s own `pump` (lines 153-171) is the shape this
 * generalises from polling a commands directory to racing a promise against a real socket's traffic,
 * recomputing the deadline fresh on every wake so activity that landed mid-sleep extends the wait
 * rather than being missed. A LAYER file, not folded into its parent: recursion needs a name to call
 * itself by, and a named function bound inside another function is a forbidden nested declaration —
 * this file's own top-level export is that name. The `sleep` timer is CLEARED right after the race
 * settles, on both branches, never left to fire on its own: `Promise.race` does not cancel the
 * losing side, so a `kill` that wins the race otherwise leaves this timer running — REF'D, since a
 * bare `setTimeout` is ref'd by default — for up to `driverStatics.idle.timeoutMs` (900s) more.
 * Measured directly, live, via `process.report.getReport().libuv` against a driver hung after a
 * successful `kill`: a `"timer"` entry with `is_referenced:true` and `firesInMsFromNow` matching the
 * remainder of that same 900s window — the one thing keeping its OS process (and so its whole
 * event loop) alive; `_getActiveHandles()`/`_getActiveRequests()` do not surface a raw timer handle
 * the same way, which is why this took a live diagnostic report to find rather than showing up in
 * either of those. `sleepTimerRef.current` (a mutable property on a `const` object), not a plain
 * reassigned `let`, holds the timer id across the `Promise` executor boundary — a `let` reassigned
 * only inside that executor reads back to `typescript-eslint` as permanently unset outside it, which
 * flags the later null-check as unreachable even though the executor runs synchronously.
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

  const sleepTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
  const sleep = new Promise<false>((resolve) => {
    sleepTimerRef.current = setTimeout(() => {
      resolve(false);
    }, deadlineMs - nowMs);
  });

  const outcome = await Promise.race([sleep, killSignal]);
  if (sleepTimerRef.current !== null) {
    clearTimeout(sleepTimerRef.current);
  }

  if (outcome) {
    return true;
  }

  return DriverIdleWaitLayerResponder({ killSignal });
};
