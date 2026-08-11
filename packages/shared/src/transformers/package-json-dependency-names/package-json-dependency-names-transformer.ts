/**
 * PURPOSE: Extracts the union of all dependency names from a package.json's dependencies, devDependencies, and peerDependencies fields
 *
 * USAGE:
 * packageJsonDependencyNamesTransformer({ packageJson: { dependencies: { '@dm/shared': '*' } } });
 * // Returns: readonly PackageJsonName[] — sorted list of unique dependency names across all three dep fields
 */

import { packageJsonContract } from '../../contracts/package-json/package-json-contract';
import type { PackageJson } from '../../contracts/package-json/package-json-contract';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const packageJsonDependencyNamesTransformer = ({
  packageJson,
}: {
  packageJson: {
    dependencies?: Record<string, string | undefined> | undefined;
    devDependencies?: Record<string, string | undefined> | undefined;
    peerDependencies?: Record<string, string | undefined> | undefined;
  };
}): readonly PackageJsonName[] => {
  const names = new Set<PackageJsonName>();
  const depNameContract = packageJsonContract.shape.name.unwrap();

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
