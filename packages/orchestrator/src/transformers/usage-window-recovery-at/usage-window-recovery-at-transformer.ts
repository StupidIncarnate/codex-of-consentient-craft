/**
 * PURPOSE: Answers when a rolling window will next sit BELOW the hold threshold, assuming nothing
 *   more is spent. Reach for this over a fixed "one window length from now": these windows roll,
 *   so the queue recovers as the oldest hour ages out, and how long that takes depends entirely on
 *   WHERE the spend sits. A week whose spend all landed yesterday recovers in six days; a week
 *   that spent the same total steadily recovers within hours.
 *
 *   It reports the time the window clears the THRESHOLD, not the time it empties. The threshold is
 *   what stopped the queue, so it is also what restarts it.
 *
 * USAGE:
 * usageWindowRecoveryAtTransformer({ buckets, windowMs, ceiling, nowMs });
 * // Returns: the branded resetsAt an on-screen countdown is rendered from — now, when already clear
 */

import {
  rateLimitWindowContract,
  type RateLimitWindow,
  type UsageLedger,
  type WeightedTokens,
} from '@dungeonmaster/shared/contracts';
import { rateLimitStatics, usageAccountingStatics } from '@dungeonmaster/shared/statics';

import { usageBucketToWeightedTransformer } from '../usage-bucket-to-weighted/usage-bucket-to-weighted-transformer';

export const usageWindowRecoveryAtTransformer = ({
  buckets,
  windowMs,
  ceiling,
  nowMs,
}: {
  buckets: UsageLedger['buckets'];
  windowMs: number;
  ceiling: WeightedTokens;
  nowMs: number;
}): RateLimitWindow['resetsAt'] => {
  const threshold =
    (ceiling * rateLimitStatics.hold.thresholdPercentage) / rateLimitStatics.percent.max;

  const inWindow = Object.entries(buckets)
    .map(([key, bucket]) => ({
      startMs: Number(key),
      weighted: usageBucketToWeightedTransformer({ bucket }),
    }))
    .filter(
      (entry) =>
        !Number.isNaN(entry.startMs) && entry.startMs >= nowMs - windowMs && entry.startMs <= nowMs,
    )
    .sort((left, right) => left.startMs - right.startMs);

  const total = inWindow.reduce((running, entry) => running + entry.weighted, 0);

  if (total < threshold) {
    return rateLimitWindowContract.shape.resetsAt.parse(new Date(nowMs).toISOString());
  }

  // Drop the oldest hours one at a time. An hour stops counting once `now` has advanced past its
  // start plus the window length; the extra bucket duration covers the hour the bucket itself
  // spans, so the answer is when the LAST message in it ages out rather than the first.
  const cleared = inWindow
    .map((entry, index) => ({
      at: entry.startMs + windowMs + usageAccountingStatics.bucket.durationMs,
      remaining: inWindow.slice(index + 1).reduce((running, later) => running + later.weighted, 0),
    }))
    .find((candidate) => candidate.remaining < threshold);

  // Dropping every bucket leaves zero, which is under any positive threshold, so `cleared` is
  // found whenever the threshold is positive. The fallback covers a zero threshold, where nothing
  // ever clears and one whole window is the honest answer.
  return rateLimitWindowContract.shape.resetsAt.parse(
    new Date(Math.max(nowMs, cleared?.at ?? nowMs + windowMs)).toISOString(),
  );
};
