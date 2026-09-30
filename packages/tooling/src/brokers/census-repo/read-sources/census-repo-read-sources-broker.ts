/**
 * PURPOSE: Finds every TypeScript file under `packages/` (skipping `node_modules`, `dist`,
 * declaration files and build output) and reads it, so the census works from one in-memory copy of
 * the repo instead of re-reading files per question. Paths come back repo-relative and sorted.
 *
 * USAGE:
 * const sources = await censusRepoReadSourcesBroker({ repoRoot });
 * // Returns [{ file: 'packages/a/src/x.ts', text: '...' }, ...]
 */
import { glob } from '#gateway/npm/glob';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import { censusRepoReadSourcesChunkLayerBroker } from './census-repo-read-sources-chunk-layer-broker';
import type { CensusSourceEntry } from '../../../contracts/census-source-entry/census-source-entry-contract';

export const censusRepoReadSourcesBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<CensusSourceEntry[]> => {
  const matches = await glob(censusLayoutStatics.sourceGlob, {
    cwd: repoRoot,
    ignore: censusLayoutStatics.ignore,
  });

  return censusRepoReadSourcesChunkLayerBroker({ repoRoot, files: matches.sort() });
};
