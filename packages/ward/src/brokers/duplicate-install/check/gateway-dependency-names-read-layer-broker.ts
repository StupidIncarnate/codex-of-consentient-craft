/**
 * PURPOSE: Reads every `packages/@gateway/*` package's own `package.json` and unions the third-party
 * names its `dependencies` and `peerDependencies` declare — the candidate list
 * `duplicateInstallCheckBroker` checks for a second top-level install elsewhere in the repo.
 * `devDependencies` is excluded on purpose: a dev-only tool never ships into a consumer's runtime
 * module graph, so two copies of one never causes the `MantineProvider`/hook/`instanceof` mismatch
 * this check exists to catch.
 *
 * USAGE:
 * await gatewayDependencyNamesReadLayerBroker({gatewayFolders: [ProjectFolderStub({path: '/repo/packages/@gateway/npm'})]});
 * // Returns: readonly DuplicateInstallPackageName[] — deduped, sorted
 */

import { readFile } from '#gateway/node/fs__promises';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import {
  duplicateInstallPackageNameContract,
  type DuplicateInstallPackageName,
} from '../../../contracts/duplicate-install-package-name/duplicate-install-package-name-contract';

export const gatewayDependencyNamesReadLayerBroker = async ({
  gatewayFolders,
}: {
  gatewayFolders: readonly ProjectFolder[];
}): Promise<readonly DuplicateInstallPackageName[]> => {
  const namesPerFolder = await Promise.all(
    gatewayFolders.map(async (folder) => {
      const packageJsonPath = filePathContract.parse(`${folder.path}/package.json`);
      const raw = await readFile(packageJsonPath);
      const parsed = packageJsonContract.parse(JSON.parse(raw));

      return [
        ...Object.keys(parsed.dependencies ?? {}),
        ...Object.keys(parsed.peerDependencies ?? {}),
      ];
    }),
  );

  const uniqueNames = [...new Set(namesPerFolder.flat())].sort();

  return uniqueNames.map((name) => duplicateInstallPackageNameContract.parse(name));
};
