/**
 * PURPOSE: Serves the 5h/7d window reading the UI paints its guardrail cards from, measured out of
 *   dungeonmaster's OWN usage ledger. Reach for this over rateLimitsState: that cache is filled by
 *   the `dungeonmaster statusline-tap` pipeline, which only writes while a user has a Claude session
 *   open with the tap configured — so on the unattended machine the guardrail exists for, it holds
 *   null forever and the cards render nothing.
 *
 *   NULL means "this machine has no denominator yet". Ceilings are LEARNED from a refusal, so until
 *   one window has been calibrated there is no honest percentage to serve, and a fabricated 0% would
 *   read as a machine with its whole quota still to spend.
 *
 * USAGE:
 * const snapshot = await RateLimitsGetResponder();
 * // Returns: RateLimitsSnapshot | null — null while neither window has a learned ceiling
 */

import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { usageLedgerScanBroker } from '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker';
import { usageLedgerToSnapshotTransformer } from '../../../transformers/usage-ledger-to-snapshot/usage-ledger-to-snapshot-transformer';

export const RateLimitsGetResponder = async (): Promise<RateLimitsSnapshot | null> => {
  const nowMs = Date.now();
  const snapshot = usageLedgerToSnapshotTransformer({
    ledger: await usageLedgerScanBroker({ nowMs }),
    nowMs,
  });

  return snapshot.fiveHour === null && snapshot.sevenDay === null ? null : snapshot;
};
