/**
 * PURPOSE: Reaps ONE registry row `cleanupRunBroker` has already proven stale — signals its
 * recorded pgids and removes its throwaway home by calling `instanceKillBroker`, reusing the
 * orphan-reap path a driver that went silent (or one that never started) already falls into,
 * rather than re-implementing the SIGTERM-then-SIGKILL escalation `laneTeardownBroker` owns.
 * `instanceKillBroker` already handles a row with no heartbeat file at all — a reservation whose
 * driver never got far enough to write one — by finding zero pgids to signal and releasing the row
 * anyway, so this broker never special-cases that itself. `staleFor` measures from
 * `entry.lastBeatMs` when one exists; a beat-less row has never advanced any clock but
 * `entry.reservedAtMs`, so that is the fallback.
 *
 * Passes its own `reason` to `instanceKillBroker` rather than accepting the generic orphan-reap
 * wording: this row is stale because ITS HEARTBEAT WENT COLD, a cause `cleanupRunBroker` has
 * already proven before ever calling this broker — naming it here is what lets `status`'s
 * `likelyCause` say what really ended the instance instead of only how the process groups died.
 *
 * USAGE:
 * await staleReapLayerBroker({
 *   entry: RegistryEntryStub({ lastBeatMs: 0 }),
 *   nowMs: 1_700_000_000_000,
 *   repoRoot: '/repo',
 * });
 * // Returns { reaped: ReapedInstance, portsReleased: readonly NetworkPort[] }
 */

import { staleReapLayerResultContract } from '../../../contracts/stale-reap-layer-result/stale-reap-layer-result-contract';
import type { StaleReapLayerResult } from '../../../contracts/stale-reap-layer-result/stale-reap-layer-result-contract';
import { reapedInstanceContract } from '../../../contracts/reaped-instance/reaped-instance-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { instanceKillBroker } from '../../instance/kill/instance-kill-broker';

export const staleReapLayerBroker = async ({
  entry,
  nowMs,
  repoRoot,
}: {
  entry: RegistryEntry;
  nowMs: number;
  repoRoot: string;
}): Promise<StaleReapLayerResult> => {
  const staleSinceMs = entry.lastBeatMs ?? entry.reservedAtMs;

  const killResult = await instanceKillBroker({
    instanceId: entry.id,
    repoRoot,
    reason: 'reaped by cleanup after its heartbeat went stale',
  });

  const staleFor = elapsedRenderTransformer({
    elapsedMs: nowMs - staleSinceMs,
  });

  return staleReapLayerResultContract.parse({
    reaped: reapedInstanceContract.parse({
      id: entry.id,
      staleFor,
      killed: killResult.reapedPgids,
      homeRemoved: killResult.homeRemoved,
    }),
    portsReleased: killResult.portsReleased,
  });
};
