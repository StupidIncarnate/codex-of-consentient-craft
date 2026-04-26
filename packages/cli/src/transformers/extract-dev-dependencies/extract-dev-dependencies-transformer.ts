/**
 * PURPOSE: Extracts devDependencies from a parsed package.json object
 *
 * USAGE:
 * const deps = extractDevDependenciesTransformer({packageJson: parsedJson});
 * // Returns DependencyMap with string key-value pairs, empty if none found
 */

import {
  dependencyMapContract,
  type DependencyMap,
} from '../../contracts/dependency-map/dependency-map-contract';
import { packageJsonContract } from '../../contracts/package-json/package-json-contract';

export const extractDevDependenciesTransformer = ({
  packageJson,
}: {
  packageJson?: unknown;
}): DependencyMap => {
  const parsed = packageJsonContract.safeParse(packageJson);

  if (!parsed.success || parsed.data.devDependencies === undefined) {
    return dependencyMapContract.parse({});
  }

  const devDeps = parsed.data.devDependencies;

  return dependencyMapContract.parse(
    Object.fromEntries(Object.entries(devDeps).filter(([, v]) => typeof v === 'string')),
  );
};
