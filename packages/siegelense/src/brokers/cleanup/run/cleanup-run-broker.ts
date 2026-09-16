/**
 * PURPOSE: The whole `cleanup {}` call — the operator's bookend at the start and end of a pass.
 * Reads the registry ONCE, reaps every `alive` row `isStaleRegistryEntryGuard` calls stale (via
 * `staleReapLayerBroker`), releases `boot.lock`/`registry.lock` only when each has outlived its own
 * TTL (via `lockReleaseLayerBroker`), and reports every row it chose NOT to touch in `leftAlone`
 * with why — a live row (`'live — last beat 2s ago'`) or a reservation that has not beaten yet
 * (`'reserved — booting, no beat yet'`, the same protection that makes the staleness guard return
 * false for `lastBeatMs: null`). `assetsAged` is deliberately ABSENT, not zero: ageing an asset
 * needs a citation resolver that also covers a `WALKED` quest-note line, which does not exist yet
 * in this package (chunk-03-read-path-and-perception.md §3.E) — shipping ageing ahead of that
 * resolver would age out a clean happy walk's own baseline shots, the exact evidence the
 * adversarial phase reads next. `cleanupAnswerContract` is `.strict()` for this reason, and stays
 * that way until the resolver lands and this file grows the field for real.
 *
 * USAGE:
 * await cleanupRunBroker();
 * // Returns { reaped, portsReleased, lockReleased, leftAlone } — no assetsAged key
 */

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { cleanupAnswerContract } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import type { CleanupAnswer } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import { leftAloneContract } from '../../../contracts/left-alone/left-alone-contract';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { lockReleaseLayerBroker } from './lock-release-layer-broker';
import { staleReapLayerBroker } from './stale-reap-layer-broker';

export const cleanupRunBroker = async (): Promise<CleanupAnswer> => {
  const nowMs = epochMsContract.parse(Date.now());
  const registry = await registryReadBroker();

  const aliveEntries = registry.instances.filter((entry) => entry.state === 'alive');
  const staleEntries = aliveEntries.filter((entry) => isStaleRegistryEntryGuard({ entry, nowMs }));

  const leftAlone = aliveEntries
    .filter((entry) => !isStaleRegistryEntryGuard({ entry, nowMs }))
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

  return cleanupAnswerContract.parse({
    reaped: reapResults.map((result) => result.reaped),
    portsReleased: reapResults.flatMap((result) => result.portsReleased),
    lockReleased,
    leftAlone,
  });
};
