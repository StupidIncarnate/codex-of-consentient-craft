/**
 * PURPOSE: Computes the root `package.json` edit `packages/CLAUDE.md` requires of every new workspace
 * package: `workspaces` only wires local symlinking, so a package absent from root `dependencies` never
 * reaches an end-user install. Isolated from install-add-dev-deps-responder's disk I/O so the merge-and-sort
 * is testable without a filesystem; today two workspace packages in this repo are missing this entry,
 * which is the drift this closes.
 *
 * USAGE:
 * const updated = rootPackageJsonRegisterTransformer({ rootPackageJson, packageName });
 * // Returns rootPackageJson unchanged if packageName is already a dependency
 */

import type { PackageName } from '@dungeonmaster/shared/contracts';
import { dependencyMapContract } from '../../contracts/dependency-map/dependency-map-contract';
import {
  packageJsonRawContract,
  type PackageJsonRaw,
} from '../../contracts/package-json-raw/package-json-raw-contract';
import { packageScaffoldConfigStatics } from '../../statics/package-scaffold-config/package-scaffold-config-statics';

export const rootPackageJsonRegisterTransformer = ({
  rootPackageJson,
  packageName,
}: {
  rootPackageJson: PackageJsonRaw;
  packageName: PackageName;
}): PackageJsonRaw => {
  const dependenciesKey = packageJsonRawContract.keySchema.parse('dependencies');
  const parsedExisting = dependencyMapContract.safeParse(rootPackageJson[dependenciesKey]);
  const existingDependencies = parsedExisting.success
    ? parsedExisting.data
    : dependencyMapContract.parse({});

  if (packageName in existingDependencies) {
    return rootPackageJson;
  }

  const mergedEntries = Object.entries({
    ...existingDependencies,
    [packageName]: packageScaffoldConfigStatics.workspaceDependencyVersion,
  }).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  const mergedDependencies = dependencyMapContract.parse(Object.fromEntries(mergedEntries));
  const updatedPackageJson = { ...rootPackageJson, dependencies: mergedDependencies };

  return updatedPackageJson;
};
