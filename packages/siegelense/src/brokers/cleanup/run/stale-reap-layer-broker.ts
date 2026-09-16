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
 * USAGE:
 * await staleReapLayerBroker({
 *   entry: RegistryEntryStub({ lastBeatMs: EpochMsStub({ value: 0 }) }),
 *   nowMs: EpochMsStub(),
 * });
 * // Returns { reaped: ReapedInstance, portsReleased: readonly NetworkPort[] }
 */

import type { NetworkPort } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { reapedInstanceContract } from '../../../contracts/reaped-instance/reaped-instance-contract';
import type { ReapedInstance } from '../../../contracts/reaped-instance/reaped-instance-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { instanceKillBroker } from '../../instance/kill/instance-kill-broker';

export const staleReapLayerBroker = async ({
  entry,
  nowMs,
}: {
  entry: RegistryEntry;
  nowMs: EpochMs;
}): Promise<{ reaped: ReapedInstance; portsReleased: readonly NetworkPort[] }> => {
  const staleSinceMs = entry.lastBeatMs ?? entry.reservedAtMs;

  const killResult = await instanceKillBroker({ instanceId: entry.id });

  const staleFor = elapsedRenderTransformer({
    elapsedMs: epochMsContract.parse(nowMs - staleSinceMs),
  });

  return {
    reaped: reapedInstanceContract.parse({
      id: entry.id,
      staleFor,
      killed: killResult.reapedPgids,
      homeRemoved: killResult.homeRemoved,
    }),
    portsReleased: killResult.portsReleased,
  };
};
