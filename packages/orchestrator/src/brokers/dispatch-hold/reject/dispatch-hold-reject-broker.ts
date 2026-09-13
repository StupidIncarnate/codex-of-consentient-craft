/**
 * PURPOSE: Records a hold because the API itself refused a request with a 429. Reach for this over
 *   dispatchHoldEvaluateBroker when there is a REFUSAL rather than a reading to act on — the spawn
 *   layer watching a child die is the one caller, and it has a line of output and no snapshot it
 *   can trust (a stale statusline is precisely how the queue got this far).
 *
 *   It never overwrites a hold that is already standing: a batch of children all die on the same
 *   refusal within a second of each other, and the first one's hold is the one with the honest
 *   clock.
 *
 * USAGE:
 * await dispatchHoldRejectBroker({ line: "You've hit your weekly limit", nowMs: Date.now() });
 * // Returns: the live DispatchHold — the one it just wrote, or the one already standing
 */

import type { DispatchHold } from '@dungeonmaster/shared/contracts';

import { isDispatchHoldExpiredGuard } from '../../../guards/is-dispatch-hold-expired/is-dispatch-hold-expired-guard';
import { rateLimitRejectionToHoldTransformer } from '../../../transformers/rate-limit-rejection-to-hold/rate-limit-rejection-to-hold-transformer';
import { dispatchStateReadBroker } from '../../dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../../dispatch-state/write/dispatch-state-write-broker';
import { usageLedgerCalibrateBroker } from '../../usage-ledger/calibrate/usage-ledger-calibrate-broker';

export const dispatchHoldRejectBroker = async ({
  line,
  nowMs,
}: {
  line: string;
  nowMs: number;
}): Promise<DispatchHold> => {
  const current = await dispatchStateReadBroker();
  const existing = current.hold ?? null;

  if (existing !== null && !isDispatchHoldExpiredGuard({ hold: existing, nowMs })) {
    return existing;
  }

  const hold = rateLimitRejectionToHoldTransformer({ line, nowMs });

  // A refusal is the ONE measurement that reveals a window's real ceiling, so it is recorded here
  // rather than left to a later pass — by the next scan the window has already started draining and
  // the number would read low. It is its own catch: failing to learn a ceiling must not stop the
  // hold that keeps the queue off the wall right now.
  await usageLedgerCalibrateBroker({ window: hold.window, nowMs }).catch((error: unknown) => {
    process.stderr.write(
      `[rate-limits] failed to calibrate the ${hold.window} ceiling: ${String(error)}\n`,
    );
  });

  const persisted = await dispatchStateWriteBroker({
    dispatchState: { ...current, hold },
  });

  return persisted.hold ?? hold;
};
