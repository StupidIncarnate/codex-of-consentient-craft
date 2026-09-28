/**
 * PURPOSE: Runs the census on a repo on disk: reads its layout and every TypeScript file under
 * `packages/`, then builds the census from that in-memory copy. It reads only and never writes
 * into the repo it scans. Reach for `adapterCensusBuildBroker` instead when the sources are already
 * in hand.
 *
 * USAGE:
 * const census = await adapterCensusRunBroker({ repoRoot });
 * // Returns { scope, packages: [{ name, dir, adapters }], totals }
 */
import { adapterCensusBuildBroker } from '../build/adapter-census-build-broker';
import { censusRepoReadLayoutBroker } from '../../census-repo/read-layout/census-repo-read-layout-broker';
import { censusRepoReadSourcesBroker } from '../../census-repo/read-sources/census-repo-read-sources-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AdapterCensus } from '../../../contracts/adapter-census/adapter-census-contract';

export const adapterCensusRunBroker = async ({
  repoRoot,
  packageFilter,
}: {
  repoRoot: AbsoluteFilePath;
  packageFilter?: string;
}): Promise<AdapterCensus> => {
  const layout = await censusRepoReadLayoutBroker({ repoRoot });
  const sources = await censusRepoReadSourcesBroker({ repoRoot });

  return adapterCensusBuildBroker({
    layout,
    sources,
    ...(packageFilter === undefined ? {} : { packageFilter }),
  });
};
