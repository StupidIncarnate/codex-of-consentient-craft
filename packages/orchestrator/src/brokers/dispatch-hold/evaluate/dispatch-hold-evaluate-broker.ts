/**
 * PURPOSE: One pass of the rate-limit guardrail — decides from the current snapshot and clock
 *   whether a hold should be raised, kept or lifted, and persists the answer. This is the ONLY
 *   writer of dispatch-state's `hold` field, so raising and lifting cannot drift apart.
 *
 *   It is deliberately idempotent and write-averse: called on every poll tick, it writes only when
 *   the answer CHANGES, so a queue sitting held for days rewrites the state file once, not every
 *   five seconds.
 *
 * USAGE:
 * const hold = await dispatchHoldEvaluateBroker({ snapshot, nowMs: Date.now() });
 * // Returns: the live DispatchHold, or null when dispatch is free to run
 *
 * WHY snapshot is a parameter: brokers cannot import state/, so the bootstrap responder passes
 *   what rateLimitsState holds and tests pass a stub.
 */

import type { DispatchHold, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { isDispatchHoldExpiredGuard } from '../../../guards/is-dispatch-hold-expired/is-dispatch-hold-expired-guard';
import { rateLimitsSnapshotToHoldTransformer } from '../../../transformers/rate-limits-snapshot-to-hold/rate-limits-snapshot-to-hold-transformer';
import { dispatchStateReadBroker } from '../../dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../../dispatch-state/write/dispatch-state-write-broker';

export const dispatchHoldEvaluateBroker = async ({
  snapshot,
  nowMs,
}: {
  snapshot: RateLimitsSnapshot | null;
  nowMs: number;
}): Promise<DispatchHold | null> => {
  const current = await dispatchStateReadBroker();
  const existing = current.hold ?? null;

  // A live hold is never re-judged against the snapshot. Re-deciding it every tick would let a
  // reading that dipped under the threshold lift a hold whose window has not actually reset — and
  // for a 429 hold there is no reading behind it to re-judge at all.
  if (existing !== null && !isDispatchHoldExpiredGuard({ hold: existing, nowMs })) {
    return existing;
  }

  // Either nothing was held, or the hold just expired. Re-reading the snapshot here is what makes
  // a 30-minute rejected hold re-hold rather than resume: if the window is still spent, this raises
  // a fresh hold on the reading, which carries the real reset time.
  const raised = rateLimitsSnapshotToHoldTransformer({ snapshot, nowMs });

  if (raised === null && existing === null) {
    return null;
  }

  const persisted = await dispatchStateWriteBroker({
    mode: current.mode,
    ...(current.mcpHeartbeatAt === undefined ? {} : { mcpHeartbeatAt: current.mcpHeartbeatAt }),
    hold: raised,
  });

  return persisted.hold ?? null;
};
