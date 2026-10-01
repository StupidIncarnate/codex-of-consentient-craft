/**
 * PURPOSE: Lists the workspace packages under a repo root: every folder of `packages/`, and of each
 * `@scope` folder inside it, whose package.json carries a name. The contract index and the owner
 * index both take their package list from here, so they agree on what a package is.
 *
 * USAGE:
 * workspacePackageListBroker({ rootDir: '/repo' });
 * // Returns ContractIndexPackage[] — [{ name: '@repo/shared', dir: '/repo/packages/shared' }, ...]
 */
import { readJsonFileSyncIfExists } from '#gateway/node/fs';

import { contractIndexPackageContract } from '../../../contracts/contract-index-package/contract-index-package-contract';
import type { ContractIndexPackage } from '../../../contracts/contract-index-package/contract-index-package-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { contractIndexStatics } from '../../../statics/contract-index/contract-index-statics';
import { subfolderPathsListLayerBroker } from './subfolder-paths-list-layer-broker';

export const workspacePackageListBroker = ({
  rootDir,
}: {
  rootDir: string;
}): ContractIndexPackage[] => {
  const packagesDir = `${rootDir}/packages`;
  const packageDirs = subfolderPathsListLayerBroker({ dirPath: packagesDir }).flatMap((dir) =>
    dir.slice(packagesDir.length + 1).startsWith(contractIndexStatics.scan.scopeFolderPrefix)
      ? subfolderPathsListLayerBroker({ dirPath: dir })
      : [dir],
  );

  return packageDirs.flatMap((dir) => {
    const parsed = packageJsonContract.safeParse(readJsonFileSyncIfExists(`${dir}/package.json`));
    const name = parsed.success ? parsed.data.name : undefined;
    return name === undefined ? [] : [contractIndexPackageContract.parse({ name, dir })];
  });
};
