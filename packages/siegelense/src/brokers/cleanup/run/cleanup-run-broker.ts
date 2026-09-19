/**
 * PURPOSE: The whole `cleanup {}` call — the operator's bookend at the start and end of a pass.
 * Reads the registry ONCE, reaps every `alive` row that is either heartbeat-stale
 * (`isStaleRegistryEntryGuard`) or a RESERVATION whose `reservedAtMs` has outlived
 * `instanceLifecycleStatics.reservation.staleAfterMs` (via `staleReapLayerBroker` either way),
 * releases `boot.lock`/`registry.lock` only when each has outlived its own TTL (via
 * `lockReleaseLayerBroker`), and reports every row it chose NOT to touch in `leftAlone` with why —
 * a live row (`'live — last beat 2s ago'`) or a reservation still inside that same ceiling
 * (`'reserved — booting, no beat yet'`). A reservation older than the ceiling is NOT left alone:
 * `isStaleRegistryEntryGuard` alone would leave it forever (it returns false for `lastBeatMs:
 * null` on purpose — see its own PURPOSE — because a fresh reservation is not the same as a
 * heartbeat gone cold), so `isReservedRegistryEntryGuard` plus the reservation ceiling is the
 * second, separate staleness test this broker adds on top. `assetsAged` runs LAST, over every row
 * this pass did not leave alone, through `assetsAgeLayerBroker` — which shares
 * `pruneInstanceReclaimBroker` with `prune`, so `cleanup` refuses exactly what `prune` refuses and
 * the two cannot drift on what "still cited" means. A row the citation resolver held back joins
 * `leftAlone` with the citing file named, which is the spec's own worked example at line 1409, and
 * it is appended rather than merged: a row already left alone for being LIVE keeps that reason,
 * since a caller asking "did you touch anything of mine" needs the first reason it would have hit.
 *
 * USAGE:
 * await cleanupRunBroker();
 * // Returns { reaped, portsReleased, lockReleased, assetsAged, leftAlone }
 */

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { cleanupAnswerContract } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import type { CleanupAnswer } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import { leftAloneContract } from '../../../contracts/left-alone/left-alone-contract';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { assetsAgeLayerBroker } from './assets-age-layer-broker';
import { lockReleaseLayerBroker } from './lock-release-layer-broker';
import { staleReapLayerBroker } from './stale-reap-layer-broker';

export const cleanupRunBroker = async (): Promise<CleanupAnswer> => {
  const nowMs = epochMsContract.parse(Date.now());
  const registry = await registryReadBroker();

  const aliveEntries = registry.instances.filter((entry) => entry.state === 'alive');

  const staleEntries = aliveEntries.filter(
    (entry) =>
      isStaleRegistryEntryGuard({ entry, nowMs }) ||
      (isReservedRegistryEntryGuard({ entry }) &&
        nowMs - entry.reservedAtMs > instanceLifecycleStatics.reservation.staleAfterMs),
  );

  const leftAlone = aliveEntries
    .filter(
      (entry) =>
        !isStaleRegistryEntryGuard({ entry, nowMs }) &&
        !(
          isReservedRegistryEntryGuard({ entry }) &&
          nowMs - entry.reservedAtMs > instanceLifecycleStatics.reservation.staleAfterMs
        ),
    )
    .map((entry) =>
      leftAloneContract.parse({
        id: entry.id,
        why:
          entry.lastBeatMs === null
            ? 'reserved — booting, no beat yet'
            : `live — last beat ${elapsedRenderTransformer({
                elapsedMs: epochMsContract.parse(nowMs - entry.lastBeatMs),
              })} ago`,
      }),
    );

  const reapResults = await Promise.all(
    staleEntries.map(async (entry) => staleReapLayerBroker({ entry, nowMs })),
  );

  const { lockReleased } = await lockReleaseLayerBroker({ nowMs });

  // Ageing runs over every row this pass did not already leave alone — a reaped instance's
  // evidence outlives its processes, so its assets are in scope the moment the reap is done.
  const leftAloneIds = new Set(leftAlone.map((entry) => String(entry.id)));
  const assetsAged = await assetsAgeLayerBroker({
    entries: registry.instances.filter((entry) => !leftAloneIds.has(String(entry.id))),
    nowMs,
  });

  return cleanupAnswerContract.parse({
    reaped: reapResults.map((result) => result.reaped),
    portsReleased: reapResults.flatMap((result) => result.portsReleased),
    lockReleased,
    assetsAged: { instances: assetsAged.instances, freedMB: assetsAged.freedMB },
    leftAlone: [
      ...leftAlone,
      ...assetsAged.refusals.map((refusal) => leftAloneContract.parse(refusal)),
    ],
  });
};
