/**
 * PURPOSE: Builds the hold raised when the API itself refused a request with a 429, reading which
 *   window the refusal named out of the child's own output line. Reach for this over
 *   rateLimitsSnapshotToHoldTransformer when there is no usable reading to work from — a refusal is
 *   what arrives when the statusline snapshot was stale, absent, or simply overtaken by a long
 *   session, so this route has a message and a clock and nothing else.
 *
 * USAGE:
 * rateLimitRejectionToHoldTransformer({ line: "You've hit your weekly limit", nowMs: Date.now() });
 * // Returns: DispatchHold on the seven-day window, resuming a fixed wait later
 */

import type { DispatchHold } from '@dungeonmaster/shared/contracts';
import { dispatchHoldContract } from '@dungeonmaster/shared/contracts';
import { rateLimitStatics } from '@dungeonmaster/shared/statics';

import { rateLimitRejectionStatics } from '../../statics/rate-limit-rejection/rate-limit-rejection-statics';

export const rateLimitRejectionToHoldTransformer = ({
  line,
  nowMs,
}: {
  line: string;
  nowMs: number;
}): DispatchHold => {
  // A refusal that names neither window falls back to five-hour — the SHORTER wait, so a marker
  // this static has not learned yet costs half an hour rather than stranding the queue for a week.
  const isSevenDay = line.includes(rateLimitRejectionStatics.windowMarkers.sevenDay);
  const window = isSevenDay ? 'seven-day' : 'five-hour';
  const label = isSevenDay
    ? rateLimitStatics.windowLabels.sevenDay
    : rateLimitStatics.windowLabels.fiveHour;

  return dispatchHoldContract.parse({
    reason: 'rejected',
    window,
    detail: `the API refused a request on the ${label} window — dispatch holds, then retries`,
    heldAt: new Date(nowMs).toISOString(),
    // A fixed wait, unlike the percentage route: the refusal carries no usage figure to hold
    // against, and re-reading the snapshot after the wait is what decides whether to hold again.
    resumeAt: new Date(nowMs + rateLimitStatics.hold.rejectedWaitMs).toISOString(),
  });
};
