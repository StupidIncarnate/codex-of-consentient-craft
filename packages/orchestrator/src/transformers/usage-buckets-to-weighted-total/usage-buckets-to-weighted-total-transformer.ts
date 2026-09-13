/**
 * PURPOSE: Sums the buckets falling inside a time window and applies the cost weights, producing
 *   the single number a ceiling is compared against. Reach for this over reading the ledger's
 *   buckets directly: every caller that added them up itself would have to repeat the weighting,
 *   and a caller that forgot it would measure the cache rather than the spend.
 *
 *   A bucket is IN the window when its start is at or after the window's start. An hour is the
 *   finest resolution the ledger keeps, so the oldest bucket is counted whole even when the window
 *   edge falls inside it — which over-counts by at most one hour and never under-counts.
 *
 * USAGE:
 * usageBucketsToWeightedTotalTransformer({ buckets, windowStartMs, nowMs });
 * // Returns: WeightedTokens for that window
 */

import { weightedTokensContract, type UsageLedger } from '@dungeonmaster/shared/contracts';
import type { WeightedTokens } from '@dungeonmaster/shared/contracts';

import { usageBucketToWeightedTransformer } from '../usage-bucket-to-weighted/usage-bucket-to-weighted-transformer';

export const usageBucketsToWeightedTotalTransformer = ({
  buckets,
  windowStartMs,
  nowMs,
}: {
  buckets: UsageLedger['buckets'];
  windowStartMs: number;
  nowMs: number;
}): WeightedTokens => {
  const total = Object.entries(buckets).reduce((running, [key, bucket]) => {
    const start = Number(key);
    // A bucket stamped in the future is a transcript written under a skewed clock; counting it
    // would inflate every window it eventually falls into, so it is left out until it is real.
    if (Number.isNaN(start) || start < windowStartMs || start > nowMs) {
      return running;
    }

    return running + usageBucketToWeightedTransformer({ bucket });
  }, 0);

  return weightedTokensContract.parse(total);
};
