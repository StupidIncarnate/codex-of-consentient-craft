/**
 * PURPOSE: Decides, from one rate-limits snapshot, whether the queue should stop dispatching — the
 *   pure core of the guardrail, so the threshold and the resume time are testable without a clock,
 *   a file or a dispatcher. Reach for this for the PERCENTAGE route; a hold raised because the API
 *   already answered 429 is built by rateLimitRejectionToHoldTransformer instead, which has a
 *   refusal rather than a reading to work from.
 *
 * USAGE:
 * rateLimitsSnapshotToHoldTransformer({ snapshot, nowMs: Date.now() });
 * // Returns: DispatchHold when a window sits at or over the threshold, else null
 *
 * WHEN-NOT-TO-USE: To decide whether an EXISTING hold has expired — that is a comparison against
 *   the stored resumeAt, and this transformer never reads one.
 */

import type { DispatchHold, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';
import { dispatchHoldContract } from '@dungeonmaster/shared/contracts';
import { rateLimitStatics } from '@dungeonmaster/shared/statics';

export const rateLimitsSnapshotToHoldTransformer = ({
  snapshot,
  nowMs,
}: {
  snapshot: RateLimitsSnapshot | null;
  nowMs: number;
}): DispatchHold | null => {
  if (snapshot === null) {
    return null;
  }

  const heldAt = new Date(nowMs).toISOString();

  // The seven-day window is tested FIRST deliberately. When both are over the line its reset is the
  // later of the two, so holding on it is the wait that actually clears both — hold on the
  // five-hour window instead and the queue resumes into a spent weekly quota a few hours later.
  // `resumeAt` is the window's own reset rather than a fixed wait: a weekly window at 93% does not
  // decay in half an hour, so a timed recheck would resume, dispatch one agent, breach again, and
  // repeat that for days.
  if (
    snapshot.sevenDay !== null &&
    snapshot.sevenDay.usedPercentage >= rateLimitStatics.hold.thresholdPercentage
  ) {
    return dispatchHoldContract.parse({
      reason: 'approaching-limit',
      window: 'seven-day',
      detail: `${rateLimitStatics.windowLabels.sevenDay} window at ${String(snapshot.sevenDay.usedPercentage)}% — dispatch holds until it resets`,
      heldAt,
      resumeAt: snapshot.sevenDay.resetsAt,
    });
  }

  if (
    snapshot.fiveHour !== null &&
    snapshot.fiveHour.usedPercentage >= rateLimitStatics.hold.thresholdPercentage
  ) {
    return dispatchHoldContract.parse({
      reason: 'approaching-limit',
      window: 'five-hour',
      detail: `${rateLimitStatics.windowLabels.fiveHour} window at ${String(snapshot.fiveHour.usedPercentage)}% — dispatch holds until it resets`,
      heldAt,
      resumeAt: snapshot.fiveHour.resetsAt,
    });
  }

  return null;
};
