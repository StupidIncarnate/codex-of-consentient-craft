/**
 * PURPOSE: Reaps ONE registry row `cleanupRunBroker` has already proven stale — signals its
 * recorded pgids and removes its throwaway home by calling `instanceKillBroker`, reusing the
 * orphan-reap path a driver that went silent already falls into, rather than re-implementing the
 * SIGTERM-then-SIGKILL escalation `laneTeardownBroker` owns. Only `entry.id` and `entry.lastBeatMs`
 * drive this broker; `entry.lastBeatMs` is required non-null because `isStaleRegistryEntryGuard`
 * — the caller's own gate — never calls this on a row that has not beaten at least once.
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
  if (entry.lastBeatMs === null) {
    throw new Error(`Instance ${entry.id} has no lastBeatMs and cannot be staleness-reaped`);
  }

  const killResult = await instanceKillBroker({ instanceId: entry.id });

  const staleFor = elapsedRenderTransformer({
    elapsedMs: epochMsContract.parse(nowMs - entry.lastBeatMs),
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
