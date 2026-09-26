/**
 * PURPOSE: Turns a bare workspace specifier (`@dungeonmaster/shared2/brokers`) into the file-system
 * target it names, by finding which known workspace package's name the specifier starts with and
 * appending the remaining subpath onto that package's own folder. Returns `undefined` for a
 * specifier that names no known package — a third-party npm package, or a workspace package the
 * walk never discovered.
 *
 * USAGE:
 * targetPathFromBareSpecifierTransformer({
 *   specifier: ModuleSpecifierStub({value: '@dungeonmaster/shared2/brokers'}),
 *   knownPackages: [ProjectFolderStub({name: '@dungeonmaster/shared2', path: '/repo/packages/shared2'})],
 * });
 * // Returns: '/repo/packages/shared2/brokers' as FilePath
 */

import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

import type { ModuleSpecifier } from '../../contracts/module-specifier/module-specifier-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import { specifierMatchesPackageGuard } from '../../guards/specifier-matches-package/specifier-matches-package-guard';

export const targetPathFromBareSpecifierTransformer = ({
  specifier,
  knownPackages,
}: {
  specifier: ModuleSpecifier;
  knownPackages: readonly ProjectFolder[];
}): FilePath | undefined => {
  const matchedPackage = knownPackages.find((projectFolder) =>
    specifierMatchesPackageGuard({ specifier, packageName: projectFolder.name }),
  );
  if (matchedPackage === undefined) {
    return undefined;
  }

  const subpath = specifier.slice(matchedPackage.name.length);
  return filePathContract.parse(
    subpath === '' ? matchedPackage.path : `${matchedPackage.path}${subpath}`,
  );
};
