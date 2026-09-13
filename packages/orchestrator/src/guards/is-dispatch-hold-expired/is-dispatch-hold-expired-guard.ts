/**
 * PURPOSE: True when a hold's resumeAt has passed, so the guardrail may lift it. This is the ONLY
 *   thing that ends a hold — there is no manual clear — which is what stops a user pressing play
 *   from dispatching straight back into a spent quota.
 *
 * USAGE:
 * isDispatchHoldExpiredGuard({ hold, nowMs: Date.now() });
 * // Returns true once now is at or past hold.resumeAt
 */

import type { DispatchHold } from '@dungeonmaster/shared/contracts';

export const isDispatchHoldExpiredGuard = ({
  hold,
  nowMs,
}: {
  hold?: DispatchHold | null;
  nowMs?: number;
}): boolean => {
  if (hold === undefined || hold === null || nowMs === undefined) {
    return false;
  }
  return nowMs >= Date.parse(hold.resumeAt);
};
