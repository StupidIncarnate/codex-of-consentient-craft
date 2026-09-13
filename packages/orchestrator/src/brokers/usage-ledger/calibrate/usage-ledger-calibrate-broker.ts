/**
 * PURPOSE: Records what a window's ceiling actually is, learned from the moment the API refused a
 *   request on it. This is the ONLY thing that ever writes a ceiling, and it is why the guardrail
 *   needs no configured budget: Anthropic publishes no number for this, so the one measurement
 *   that can produce it is a refusal, and the weighted spend standing at that instant IS the
 *   ceiling by definition.
 *
 *   It keeps the HIGHEST ceiling it has seen for a window. A refusal can arrive slightly after the
 *   real limit (a request in flight when the quota ran out), so the largest observation is the
 *   closest to the truth, and taking the latest instead would let one early refusal permanently
 *   shrink the budget.
 *
 * USAGE:
 * await usageLedgerCalibrateBroker({ window: 'seven-day', nowMs: Date.now() });
 * // Returns the ledger as persisted, with that window's ceiling set
 */

import type { DispatchHold, UsageLedger } from '@dungeonmaster/shared/contracts';
import { weightedTokensContract } from '@dungeonmaster/shared/contracts';
import { usageAccountingStatics } from '@dungeonmaster/shared/statics';

import { usageBucketsToWeightedTotalTransformer } from '../../../transformers/usage-buckets-to-weighted-total/usage-buckets-to-weighted-total-transformer';
import { usageLedgerReadBroker } from '../read/usage-ledger-read-broker';
import { usageLedgerWriteBroker } from '../write/usage-ledger-write-broker';

export const usageLedgerCalibrateBroker = async ({
  window,
  nowMs,
}: {
  window: DispatchHold['window'];
  nowMs: number;
}): Promise<UsageLedger> => {
  const ledger = await usageLedgerReadBroker();

  const windowMs =
    window === 'seven-day'
      ? usageAccountingStatics.windows.sevenDayMs
      : usageAccountingStatics.windows.fiveHourMs;

  const observed = usageBucketsToWeightedTotalTransformer({
    buckets: ledger.buckets,
    windowStartMs: nowMs - windowMs,
    nowMs,
  });

  // Nothing measured yet — a refusal that arrives before the first scan has no spend behind it,
  // and recording a ceiling of zero would make every later reading read as infinite.
  if (observed <= 0) {
    return ledger;
  }

  const previous = window === 'seven-day' ? ledger.ceilings.sevenDay : ledger.ceilings.fiveHour;
  // Re-parsed rather than handed straight through: Math.max returns a plain number and drops the
  // WeightedTokens brand, so the contract is what puts it back.
  const ceiling =
    previous === null ? observed : weightedTokensContract.parse(Math.max(previous, observed));

  return usageLedgerWriteBroker({
    ledger: {
      buckets: ledger.buckets,
      cursors: ledger.cursors,
      ceilings:
        window === 'seven-day'
          ? { fiveHour: ledger.ceilings.fiveHour, sevenDay: ceiling }
          : { fiveHour: ceiling, sevenDay: ledger.ceilings.sevenDay },
      updatedAt: ledger.updatedAt,
    },
    nowMs,
  });
};
