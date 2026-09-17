/**
 * PURPOSE: `cleanup`'s `assetsAged` — the age-out that happens by default, so disk does not only
 * grow (siegelense-tooling.md line 244). TWO passes per instance, and the order is the point: video
 * first on its own shorter window, because "a screencast dwarfs every shot and transcript combined,
 * so it ages out first and separately" (line 248), then everything else on the default window. The
 * second pass re-lists, so it sees the tree the first pass left. Every pass goes through
 * `pruneInstanceReclaimBroker`, which means `cleanup` refuses exactly what `prune` refuses: a live
 * instance, and anything a `VERIFIED` prelude or an open quest's `WALKED` line still cites (line
 * 2453). Reach for this over calling `pruneRunBroker` from `cleanup`: that one reads the registry
 * and writes tombstones of its own, and `cleanup` already holds both.
 *
 * USAGE:
 * await assetsAgeLayerBroker({ entries, nowMs });
 * // Returns { instances, freedMB, refusals, gaps } — refusals become cleanup's own leftAlone rows
 */

import type { CitationGap } from '../../../contracts/citation-gap/citation-gap-contract';
import type { CitationKind } from '../../../contracts/citation-kind/citation-kind-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { megabytesContract } from '../../../contracts/megabytes/megabytes-contract';
import type { Megabytes } from '../../../contracts/megabytes/megabytes-contract';
import { pruneQueryContract } from '../../../contracts/prune-query/prune-query-contract';
import type { PruneRefusal } from '../../../contracts/prune-refusal/prune-refusal-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { pruneStatics } from '../../../statics/prune/prune-statics';
import { pruneOlderThanParseTransformer } from '../../../transformers/prune-older-than-parse/prune-older-than-parse-transformer';
import { pruneInstanceReclaimBroker } from '../../prune/instance-reclaim/prune-instance-reclaim-broker';

const VIDEO_QUERY = pruneQueryContract.parse({
  instanceId: null,
  kind: 'video',
  olderThan: pruneStatics.window.videoOlderThan,
});

const EVERYTHING_QUERY = pruneQueryContract.parse({
  instanceId: null,
  kind: null,
  olderThan: pruneStatics.window.defaultOlderThan,
});

export const assetsAgeLayerBroker = async ({
  entries,
  nowMs,
}: {
  entries: readonly RegistryEntry[];
  nowMs: EpochMs;
}): Promise<{
  instances: ReadingCount;
  freedMB: Megabytes;
  refusals: readonly PruneRefusal[];
  gaps: readonly CitationGap[];
}> => {
  const videoMs = pruneOlderThanParseTransformer({ olderThan: VIDEO_QUERY.olderThan });
  const everythingMs = pruneOlderThanParseTransformer({ olderThan: EVERYTHING_QUERY.olderThan });

  const outcomes = await Promise.all(
    entries.map(async (entry) => {
      const video = await pruneInstanceReclaimBroker({
        entry,
        query: VIDEO_QUERY,
        olderThanMs: videoMs,
        nowMs,
      });
      const everything = await pruneInstanceReclaimBroker({
        entry,
        query: EVERYTHING_QUERY,
        olderThanMs: everythingMs,
        nowMs,
      });

      return [video, everything];
    }),
  );

  const freedBytes = outcomes.reduce(
    (total, passes) =>
      total +
      passes.reduce((perInstance, pass) => perInstance + Number(pass.removal?.freedBytes ?? 0), 0),
    0,
  );

  const touched = outcomes.filter((passes) => passes.some((pass) => pass.removal !== null)).length;

  // One refusal per INSTANCE, not per pass: both passes ask the same citation question, and a
  // cleanup that printed the same citing file twice reads as two problems.
  const refusals = outcomes.flatMap((passes) => {
    const refusal = passes.find((pass) => pass.refusal !== null)?.refusal;
    return refusal === undefined || refusal === null ? [] : [refusal];
  });

  const gapsByKind = new Map<CitationKind, CitationGap>();
  for (const passes of outcomes) {
    for (const pass of passes) {
      for (const gap of pass.gaps) {
        gapsByKind.set(gap.kind, gap);
      }
    }
  }

  return {
    instances: readingCountContract.parse(touched),
    freedMB: megabytesContract.parse(Math.floor(freedBytes / pruneStatics.size.bytesPerMegabyte)),
    refusals,
    gaps: [...gapsByKind.values()],
  };
};
