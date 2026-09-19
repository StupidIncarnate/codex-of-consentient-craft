/**
 * PURPOSE: Everything one instance has on disk that `prune` and `cleanup` may take, weighed and
 * dated, plus the run ids that tree holds. It reads and deletes nothing: knowing what would go, and
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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { pruneAssetContract } from '../../../contracts/prune-asset/prune-asset-contract';
import type { PruneAsset } from '../../../contracts/prune-asset/prune-asset-contract';
import { pruneAssetKindContract } from '../../../contracts/prune-asset-kind/prune-asset-kind-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
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

const LOG_KIND = pruneAssetKindContract.parse('log');
const TRANSCRIPT_KIND = pruneAssetKindContract.parse('transcript');

export const pruneAssetsListBroker = async ({
  entry,
}: {
  entry: RegistryEntry;
}): Promise<{ assets: readonly PruneAsset[]; runIds: readonly RunId[] }> => {
  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId: entry.id,
    guildId: entry.guildId,
  });
  const { runsDir, logs, transcripts } = locationsPruneAssetPathsFindBroker({ evidencePath });

  const logRows = await Promise.all(
    logs.map(async (filePath) => {
      const stat = await fsStatAdapter({ filePath });
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

  const bufferRows = await Promise.all(
    transcripts.map(async (filePath) => {
      const stat = await fsStatAdapter({ filePath });
      return stat === null
        ? []
        : [
            pruneAssetContract.parse({
              path: filePath,
              kind: TRANSCRIPT_KIND,
              sizeBytes: stat.sizeBytes,
              modifiedAtMs: stat.modifiedAtMs,
            }),
          ];
    }),
  );

  const runsEntries = await fsReaddirAdapter({ dirPath: runsDir });

  const runIdValues = new Set(
    runsEntries.flatMap((fileName) => {
      const parsed = runIdContract.safeParse(String(fileName).replace(RUN_FILE_SUFFIX, ''));
      return parsed.success ? [String(parsed.data)] : [];
    }),
  );
  const runIds = [...runIdValues].sort().map((value) => runIdContract.parse(value));

  const runFileRows = await Promise.all(
    runsEntries.map(async (fileName) => {
      const kind = pruneAssetClassifyTransformer({ fileName });

      if (kind === null) {
        return [];
      }

      const filePath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [runsDir, fileName] }),
      );
      const stat = await fsStatAdapter({ filePath });

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

  return {
    assets: [...logRows.flat(), ...bufferRows.flat(), ...runFileRows.flat(), ...shotRows.flat()],
    runIds,
  };
};
