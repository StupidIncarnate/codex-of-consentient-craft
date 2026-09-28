/**
 * PURPOSE: Reads a repo's workspace layout: the scope from the root package.json `name` (through
 * the same transformer the gateway lint rules use, so nothing here hard-codes a scope) and every
 * package one or two folders under `packages/` (a gateway sits at `packages/@gateway/<kind>`) that has a name. A root package.json that cannot
 * be read fails with the path in the message, because a census of the wrong directory is silent
 * otherwise.
 *
 * USAGE:
 * const layout = await censusRepoReadLayoutBroker({ repoRoot });
 * // Returns { scope: '@acme', packages: [{ name: '@acme/app', dir: 'packages/app' }, ...] }
 */
import { glob } from '#gateway/npm/glob';
import { readJsonFile } from '#gateway/node/fs__promises';
import { dirname, join, relative } from '#gateway/node/path';
import { workspaceScopeFromRootNameTransformer } from '@dungeonmaster/shared/transformers';
import { censusRepoLayoutContract } from '../../../contracts/census-repo-layout/census-repo-layout-contract';
import { censusRootPackageContract } from '../../../contracts/census-root-package/census-root-package-contract';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { CensusRepoLayout } from '../../../contracts/census-repo-layout/census-repo-layout-contract';

export const censusRepoReadLayoutBroker = async ({
  repoRoot,
}: {
  repoRoot: AbsoluteFilePath;
}): Promise<CensusRepoLayout> => {
  const rootManifest = join(repoRoot, censusLayoutStatics.packageJsonFile);
  const root = censusRootPackageContract.parse(
    await readJsonFile(rootManifest).catch((error: unknown) => {
      throw new Error(`adapter-census: cannot read ${rootManifest}: ${String(error)}`, {
        cause: error,
      });
    }),
  );
  const scope = workspaceScopeFromRootNameTransformer({ rootPackageJsonName: root.name });

  const manifests = await glob([...censusLayoutStatics.packageJsonGlobs], {
    cwd: repoRoot,
    ignore: censusLayoutStatics.ignore,
  });
  const packages = await Promise.all(
    manifests.sort().map(async (manifest) => ({
      name: censusRootPackageContract.parse(await readJsonFile(manifest)).name,
      dir: relative(repoRoot, dirname(manifest)),
    })),
  );

  return censusRepoLayoutContract.parse({
    scope: scope ?? null,
    packages: packages.filter((pkg) => pkg.name !== undefined),
  });
};
