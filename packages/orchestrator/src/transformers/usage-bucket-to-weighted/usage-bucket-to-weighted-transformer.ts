/**
 * PURPOSE: Applies the cost multipliers to ONE bucket. Reach for this rather than writing the four
 *   multiplications at a call site: two callers need per-bucket weighting — the window total and
 *   the recovery-time walk — and a second copy of the formula is how the two would drift into
 *   disagreeing about what the same hour cost.
 *
 * USAGE:
 * usageBucketToWeightedTransformer({ bucket });
 * // Returns: WeightedTokens for that one hour
 */

import { weightedTokensContract, type UsageBucket } from '@dungeonmaster/shared/contracts';
import type { WeightedTokens } from '@dungeonmaster/shared/contracts';
import { usageAccountingStatics } from '@dungeonmaster/shared/statics';

export const usageBucketToWeightedTransformer = ({
  bucket,
}: {
  bucket: UsageBucket;
}): WeightedTokens =>
  weightedTokensContract.parse(
    bucket.input * usageAccountingStatics.weights.input +
      bucket.cacheCreation * usageAccountingStatics.weights.cacheCreation +
      bucket.cacheRead * usageAccountingStatics.weights.cacheRead +
      bucket.output * usageAccountingStatics.weights.output,
  );
