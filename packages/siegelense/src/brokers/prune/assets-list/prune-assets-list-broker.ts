/**
 * PURPOSE: Everything one instance has on disk that `prune` and `cleanup` may take, weighed and
 * dated, plus the run ids that tree holds — the lane's `video/` directory included, since `--kind
 * video` has nothing to match without it. It reads and deletes nothing: knowing what would go, and
 * how much it is worth, has to happen BEFORE the citation resolver is asked whether any of it may,
 * and the run ids are half of that question — a `VERIFIED` prelude names a RUN, and only this tree
 * says which runs are this instance's. Reach for this over `locationsPruneAssetPathsFindBroker`:
 * that one answers which paths exist in the layout, while this one answers which of them are
 * actually on disk and what they weigh.
 *
 * USAGE:
 * await pruneAssetsListBroker({ entry });
 * // Returns { assets, runIds } — assets is empty for an instance whose tree was already taken
 */

import { pruneAssetsListResultContract } from '../../../contracts/prune-assets-list-result/prune-assets-list-result-contract';
import type { PruneAssetsListResult } from '../../../contracts/prune-assets-list-result/prune-assets-list-result-contract';
import { join } from '#gateway/node/path';
import { siegeRunContract } from '@dungeonmaster/shared/contracts';

import { readdirIfExists, statIfExists } from '#gateway/node/fs__promises';
import { pruneAssetContract } from '../../../contracts/prune-asset/prune-asset-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { pruneAssetClassifyTransformer } from '../../../transformers/prune-asset-classify/prune-asset-classify-transformer';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsPruneAssetPathsFindBroker } from '../../locations/prune-asset-paths-find/locations-prune-asset-paths-find-broker';
import { runShotsLayerBroker } from './run-shots-layer-broker';

// A run's files are `run_2.jsonl` and `run_2.json`; its shots live in a directory named `run_2`
// with no extension at all. Stripping either suffix and re-parsing is what makes all three forms
// name the same run.
const RUN_FILE_SUFFIX = new RegExp(
  `(${evidenceFileStatics.extensions.transcript}|${evidenceFileStatics.extensions.runReturn})$`,
  'u',
);

const LOG_KIND = 'log';

export const pruneAssetsListBroker = async ({
  entry,
}: {
  entry: RegistryEntry;
}): Promise<PruneAssetsListResult> => {
  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId: entry.id,
    guildId: entry.guildId,
  });
  const { runsDir, videoDir, logs, transcripts } = locationsPruneAssetPathsFindBroker({
    evidencePath,
  });

  const logRows = await Promise.all(
    logs.map(async (filePath) => {
      const stat = await statIfExists(filePath);
      return stat === null
        ? []
        : [
            pruneAssetContract.parse({
              path: filePath,
              kind: LOG_KIND,
              sizeBytes: stat.sizeBytes,
              modifiedAtMs: stat.modifiedAtMs,
            }),
          ];
    }),
  );

  // The three per-instance capture buffers classify as `log`, not `transcript` — a session
  // transcript is a Claude-style `.jsonl` under `.claude/projects/`, which this call does not list.
  // These are the instance's own capture record, the same as the process logs above.
  const bufferRows = await Promise.all(
    transcripts.map(async (filePath) => {
      const stat = await statIfExists(filePath);
      return stat === null
        ? []
        : [
            pruneAssetContract.parse({
              path: filePath,
              kind: LOG_KIND,
              sizeBytes: stat.sizeBytes,
              modifiedAtMs: stat.modifiedAtMs,
            }),
          ];
    }),
  );

  const runsEntries = (await readdirIfExists(runsDir)) ?? [];

  const runIdValues = new Set(
    runsEntries.flatMap((fileName) => {
      const parsed = siegeRunContract.shape.id.safeParse(fileName.replace(RUN_FILE_SUFFIX, ''));
      return parsed.success ? [String(parsed.data)] : [];
    }),
  );
  const runIds = [...runIdValues].sort().map((value) => siegeRunContract.shape.id.parse(value));

  const runFileRows = await Promise.all(
    runsEntries.map(async (entryName) => {
      const fileName = entryName;
      const kind = pruneAssetClassifyTransformer({ fileName });

      if (kind === null) {
        return [];
      }

      const filePath = join(runsDir, fileName);
      const stat = await statIfExists(filePath);

      return stat === null
        ? []
        : [
            pruneAssetContract.parse({
              path: filePath,
              kind,
              sizeBytes: stat.sizeBytes,
              modifiedAtMs: stat.modifiedAtMs,
            }),
          ];
    }),
  );

  const shotRows = await Promise.all(
    runIds.map(async (runId) => runShotsLayerBroker({ evidencePath, runId })),
  );

  const videoEntries = (await readdirIfExists(videoDir)) ?? [];
  const videoRows = await Promise.all(
    videoEntries.map(async (entryName) => {
      const fileName = entryName;
      const kind = pruneAssetClassifyTransformer({ fileName });

      if (kind === null) {
        return [];
      }

      const filePath = join(videoDir, fileName);
      const stat = await statIfExists(filePath);

      return stat === null
        ? []
        : [
            pruneAssetContract.parse({
              path: filePath,
              kind,
              sizeBytes: stat.sizeBytes,
              modifiedAtMs: stat.modifiedAtMs,
            }),
          ];
    }),
  );

  return pruneAssetsListResultContract.parse({
    assets: [
      ...logRows.flat(),
      ...bufferRows.flat(),
      ...runFileRows.flat(),
      ...shotRows.flat(),
      ...videoRows.flat(),
    ],
    runIds,
  });
};
