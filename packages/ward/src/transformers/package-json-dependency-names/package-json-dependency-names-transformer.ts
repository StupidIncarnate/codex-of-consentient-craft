/**
 * PURPOSE: Extracts the union of all dependency names from a PackageJson's dependencies, devDependencies, and peerDependencies
 *
 * USAGE:
 * packageJsonDependencyNamesTransformer({ packageJson: PackageJsonStub({ dependencies: { '@dm/shared': '*' } }) });
 * // Returns: readonly PackageJsonName[] — sorted list of unique dependency names across all three dep fields
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';
import { workspaceInputContract } from '../../contracts/workspace-input/workspace-input-contract';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const packageJsonDependencyNamesTransformer = ({
  packageJson,
}: {
  packageJson: PackageJson;
}): readonly PackageJsonName[] => {
  const names = new Set<PackageJsonName>();
  const depNameContract = workspaceInputContract.shape.dependencyNames.removeDefault().element;

  for (const key of Object.keys(packageJson.dependencies ?? {})) {
    names.add(depNameContract.parse(key));
  }
  for (const key of Object.keys(packageJson.devDependencies ?? {})) {
    names.add(depNameContract.parse(key));
  }
  for (const key of Object.keys(packageJson.peerDependencies ?? {})) {
    names.add(depNameContract.parse(key));
  }

  return [...names];
};
