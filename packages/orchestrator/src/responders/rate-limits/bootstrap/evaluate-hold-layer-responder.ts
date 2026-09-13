/**
 * PURPOSE: Runs one guardrail pass — brings the measured usage ledger up to date, derives the
 *   window percentages from it, publishes them, decides the hold, and mirrors the answer into the
 *   in-memory dispatch state so the loop's synchronous getIsPlaying() sees it without touching disk.
 *
 *   The reading comes from the LEDGER, never from the statusline snapshot. Anthropic's percentages
 *   only exist while a user has a session open with a statusline configured to record them, and a
 *   queue running unattended overnight is exactly the case the guardrail is for — so dungeonmaster
 *   measures its own spend out of the transcripts instead.
 *
 *   IT IS ALSO THE ONLY THING THAT PUBLISHES A LEDGER-DERIVED READING. The bus event that tells a
 *   browser to re-fetch the rate-limit cards used to hang off the statusline file changing, and
 *   nothing writes that file any more — so without the emit below the cards render once on page
 *   load and never move again, however much quota is spent while someone watches.
 *
 *   Fire-and-forget by design: the caller is the rate-limits poller's tick, which cannot await, and
 *   a failed read must never kill that poller — it is the only thing able to LIFT a hold later, so
 *   letting it die would strand the queue permanently.
 *
 * USAGE:
 * EvaluateHoldLayerResponder();
 * // Returns immediately; the hold lands in orchestrationDispatchState once the scan resolves
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { dispatchHoldEvaluateBroker } from '../../../brokers/dispatch-hold/evaluate/dispatch-hold-evaluate-broker';
import { usageLedgerScanBroker } from '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker';
import { hasRateLimitsSnapshotChangedGuard } from '../../../guards/has-rate-limits-snapshot-changed/has-rate-limits-snapshot-changed-guard';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { rateLimitsState } from '../../../state/rate-limits/rate-limits-state';
import { usageLedgerToSnapshotTransformer } from '../../../transformers/usage-ledger-to-snapshot/usage-ledger-to-snapshot-transformer';

const MEASURE_PROCESS_ID = processIdContract.parse('rate-limits-measure');

export const EvaluateHoldLayerResponder = (): AdapterResult => {
  const nowMs = Date.now();

  usageLedgerScanBroker({ nowMs })
    .then(async (ledger) => {
      const snapshot = usageLedgerToSnapshotTransformer({ ledger, nowMs });

      // Only on a real change. The snapshot carries an `updatedAt` stamped from the clock, so an
      // unguarded emit would fire on every poll tick and the browser would re-fetch forever.
      if (hasRateLimitsSnapshotChangedGuard({ previous: rateLimitsState.get(), next: snapshot })) {
        rateLimitsState.set({ snapshot });
        orchestrationEventsState.emit({
          type: 'rate-limits-updated',
          processId: MEASURE_PROCESS_ID,
          payload: { snapshot },
        });
      }

      return dispatchHoldEvaluateBroker({ snapshot, nowMs });
    })
    .then((hold) => {
      orchestrationDispatchState.setHold({ hold });
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `[rate-limits] dispatch hold evaluation failed: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    });

  // Reports that the pass was STARTED, not what it decided — the caller is a timer tick with
  // nothing to await. The decision reaches the world through orchestrationDispatchState above.
  return adapterResultContract.parse({ success: true });
};
