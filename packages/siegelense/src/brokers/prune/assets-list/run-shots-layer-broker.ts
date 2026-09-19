/**
 * PURPOSE: Lists and weighs one run's captured frames — the entries inside `runs/<runId>/`, which is
 * the only part of an instance's tree nobody can name in advance, because a run holds one file per
 * captured step. Every entry is classified by extension and an unrecognised one is SKIPPED rather
 * than swept up: `prune` deletes, and a file some later chunk starts writing here must not go with
 * the shots before anyone has decided how long it should live. Reach for this over listing inside
 * `pruneAssetsListBroker`: that broker walks a flat set of resolved names, and folding a per-run
 * nested listing into it would put two levels of `Promise.all` in the one file that must stay
 * readable.
 *
 * USAGE:
 * await runShotsLayerBroker({ evidencePath, runId });
 * // Returns every .png and .webm inside runs/<runId>/, each with its real size and last write
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { pruneAssetContract } from '../../../contracts/prune-asset/prune-asset-contract';
import type { PruneAsset } from '../../../contracts/prune-asset/prune-asset-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { pruneAssetClassifyTransformer } from '../../../transformers/prune-asset-classify/prune-asset-classify-transformer';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';

export const runShotsLayerBroker = async ({
  evidencePath,
  runId,
}: {
  evidencePath: AbsoluteFilePath;
  runId: RunId;
}): Promise<readonly PruneAsset[]> => {
  const { shotsDir } = locationsRunPathsFindBroker({ evidencePath, runId });
  const entries = await fsReaddirAdapter({ dirPath: shotsDir });

  const found = await Promise.all(
    entries.map(async (fileName) => {
      const kind = pruneAssetClassifyTransformer({ fileName });

      if (kind === null) {
        return [];
      }

      const filePath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [shotsDir, fileName] }),
      );
      const stat = await fsStatAdapter({ filePath });

      if (stat === null) {
        return [];
      }

      return [
        pruneAssetContract.parse({
          path: filePath,
          kind,
          sizeBytes: stat.sizeBytes,
          modifiedAtMs: stat.modifiedAtMs,
        }),
      ];
    }),
  );

  return found.flat();
};
