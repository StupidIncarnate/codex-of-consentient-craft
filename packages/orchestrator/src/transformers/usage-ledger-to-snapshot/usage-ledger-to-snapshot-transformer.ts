/**
 * PURPOSE: Turns the measured ledger into the same RateLimitsSnapshot shape the statusline tap
 *   produces, so the guardrail, the API route and the UI cards all consume one contract whatever
 *   the source. Reach for this rather than teaching the hold logic about buckets: the percentage
 *   gate, the hold transformer and the queue banner were all written against that snapshot, and a
 *   second shape would fork every one of them.
 *
 *   A window with no observed ceiling reports NULL rather than a percentage, and a null window
 *   raises no hold. That is the deliberate degraded mode on a machine that has never been
 *   refused: the 429 path still stops the queue, and the first refusal is what calibrates the
 *   denominator for every window after it.
 *
 * USAGE:
 * usageLedgerToSnapshotTransformer({ ledger, nowMs: Date.now() });
 * // Returns: RateLimitsSnapshot with a percentage per calibrated window
 */

import {
  rateLimitsSnapshotContract,
  type RateLimitsSnapshot,
  type UsageLedger,
} from '@dungeonmaster/shared/contracts';
import { rateLimitStatics, usageAccountingStatics } from '@dungeonmaster/shared/statics';

import { usageBucketsToWeightedTotalTransformer } from '../usage-buckets-to-weighted-total/usage-buckets-to-weighted-total-transformer';
import { usageWindowRecoveryAtTransformer } from '../usage-window-recovery-at/usage-window-recovery-at-transformer';

export const usageLedgerToSnapshotTransformer = ({
  ledger,
  nowMs,
}: {
  ledger: UsageLedger;
  nowMs: number;
}): RateLimitsSnapshot => {
  const fiveHourCeiling = ledger.ceilings.fiveHour;
  const sevenDayCeiling = ledger.ceilings.sevenDay;

  const fiveHourSpend = usageBucketsToWeightedTotalTransformer({
    buckets: ledger.buckets,
    windowStartMs: nowMs - usageAccountingStatics.windows.fiveHourMs,
    nowMs,
  });
  const sevenDaySpend = usageBucketsToWeightedTotalTransformer({
    buckets: ledger.buckets,
    windowStartMs: nowMs - usageAccountingStatics.windows.sevenDayMs,
    nowMs,
  });

  return rateLimitsSnapshotContract.parse({
    fiveHour:
      fiveHourCeiling === null || fiveHourCeiling <= 0
        ? null
        : {
            usedPercentage: Math.min(
              rateLimitStatics.percent.max,
              Math.round((fiveHourSpend / fiveHourCeiling) * rateLimitStatics.percent.max),
            ),
            resetsAt: usageWindowRecoveryAtTransformer({
              buckets: ledger.buckets,
              windowMs: usageAccountingStatics.windows.fiveHourMs,
              ceiling: fiveHourCeiling,
              nowMs,
            }),
          },
    sevenDay:
      sevenDayCeiling === null || sevenDayCeiling <= 0
        ? null
        : {
            usedPercentage: Math.min(
              rateLimitStatics.percent.max,
              Math.round((sevenDaySpend / sevenDayCeiling) * rateLimitStatics.percent.max),
            ),
            resetsAt: usageWindowRecoveryAtTransformer({
              buckets: ledger.buckets,
              windowMs: usageAccountingStatics.windows.sevenDayMs,
              ceiling: sevenDayCeiling,
              nowMs,
            }),
          },
    updatedAt: new Date(nowMs).toISOString(),
  });
};
