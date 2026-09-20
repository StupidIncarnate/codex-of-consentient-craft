/**
 * PURPOSE: The whole decision and the whole deletion for ONE instance, in the order that makes the
 * deletion safe: weigh what would go, ASK whether it may, and only then unlink. A live instance is
 * refused before its tree is even read — "`prune` refuses a LIVE instance's assets, whoever started
 * it" (siegelense-tooling.md line 312) — and a cited or unresolvable one is refused with the citing
 * file named. Nothing selected is neither a removal nor a refusal: on a whole-registry sweep most
 * rows are simply inside the window, and reporting each as refused would bury the ones that matter.
 * It is its own DOMAIN rather than a layer under `prune/run/` because `cleanup` ages assets through
 * exactly this reclaim and `enforce-import-dependencies` admits no cross-domain import of a layer
 * file — so the two calls sharing one refusal rule needs one entry file, not two copies.
 *
 * USAGE:
 * await pruneInstanceReclaimBroker({ entry, query, olderThanMs, nowMs });
 * // Returns { removal, refusal, gaps } — both null when nothing was selected; never both set
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import type { CitationGap } from '../../../contracts/citation-gap/citation-gap-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { fileSizeBytesContract } from '../../../contracts/file-size-bytes/file-size-bytes-contract';
import { megabytesContract } from '../../../contracts/megabytes/megabytes-contract';
import type { PruneQuery } from '../../../contracts/prune-query/prune-query-contract';
import { pruneRefusalContract } from '../../../contracts/prune-refusal/prune-refusal-contract';
import type { PruneRefusal } from '../../../contracts/prune-refusal/prune-refusal-contract';
import { pruneRemovalContract } from '../../../contracts/prune-removal/prune-removal-contract';
import type { PruneRemoval } from '../../../contracts/prune-removal/prune-removal-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { pruneStatics } from '../../../statics/prune/prune-statics';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { citationResolveBroker } from '../../citation/resolve/citation-resolve-broker';
import { pruneAssetsListBroker } from '../assets-list/prune-assets-list-broker';

export const pruneInstanceReclaimBroker = async ({
  entry,
  query,
  olderThanMs,
  nowMs,
}: {
  entry: RegistryEntry;
  query: PruneQuery;
  olderThanMs: EpochMs;
  nowMs: EpochMs;
}): Promise<{
  removal: PruneRemoval | null;
  refusal: PruneRefusal | null;
  gaps: readonly CitationGap[];
}> => {
  const reservationStale =
    isReservedRegistryEntryGuard({ entry }) &&
    nowMs - entry.reservedAtMs > instanceLifecycleStatics.reservation.staleAfterMs;
  const live =
    entry.state === 'alive' && !isStaleRegistryEntryGuard({ entry, nowMs }) && !reservationStale;

  if (live) {
    return {
      removal: null,
      refusal: pruneRefusalContract.parse({
        id: entry.id,
        why: contentTextContract.parse(
          entry.lastBeatMs === null
            ? 'reserved — booting, no beat yet'
            : `live — last beat ${elapsedRenderTransformer({
                elapsedMs: epochMsContract.parse(nowMs - entry.lastBeatMs),
              })} ago`,
        ),
      }),
      gaps: [],
    };
  }

  const { assets, runIds } = await pruneAssetsListBroker({ entry });

  const selected = assets.filter(
    (asset) =>
      (query.kind === null || asset.kind === query.kind) &&
      nowMs - asset.modifiedAtMs >= olderThanMs,
  );

  if (selected.length === 0) {
    return { removal: null, refusal: null, gaps: [] };
  }

  const resolution = await citationResolveBroker({ entry, runIds });

  if (resolution.blocked !== null) {
    return {
      removal: null,
      refusal: pruneRefusalContract.parse({ id: entry.id, why: resolution.blocked }),
      gaps: resolution.gaps,
    };
  }

  if (resolution.references.length > 0) {
    return {
      removal: null,
      refusal: pruneRefusalContract.parse({
        id: entry.id,
        why: contentTextContract.parse(
          resolution.references.map((reference) => String(reference.why)).join('; '),
        ),
      }),
      gaps: resolution.gaps,
    };
  }

  // The one irreversible step in this tool, and it is reached only past both refusal gates.
  await Promise.all(selected.map(async (asset) => fsUnlinkAdapter({ filePath: asset.path })));

  const freedBytes = selected.reduce((total, asset) => total + Number(asset.sizeBytes), 0);

  return {
    removal: pruneRemovalContract.parse({
      id: entry.id,
      kind: query.kind,
      freedBytes: fileSizeBytesContract.parse(freedBytes),
      freedMB: megabytesContract.parse(Math.floor(freedBytes / pruneStatics.size.bytesPerMegabyte)),
      // A row reads `pruned` only when its tree is genuinely gone. A `--kind` selector leaves the
      // rest of the evidence on disk, and a row tombstoned over it would make `results` answer
      // `pruned` for transcripts a fixer can still open.
      tombstoned: query.kind === null && selected.length === assets.length,
    }),
    refusal: null,
    gaps: resolution.gaps,
  };
};
