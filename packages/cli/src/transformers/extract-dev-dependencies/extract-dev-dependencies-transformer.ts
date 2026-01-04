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

export const extractDevDependenciesTransformer = ({
  packageJson,
}: {
  packageJson?: unknown;
}): DependencyMap => {
  if (typeof packageJson !== 'object' || packageJson === null) {
    return dependencyMapContract.parse({});
  }

  if (!('devDependencies' in packageJson)) {
    return dependencyMapContract.parse({});
  }

  const devDeps = Reflect.get(packageJson, 'devDependencies');

  if (typeof devDeps !== 'object' || devDeps === null) {
    return dependencyMapContract.parse({});
  }

  const result: DependencyMap = dependencyMapContract.parse({});

  for (const key of Object.keys(devDeps)) {
    const value: unknown = Reflect.get(devDeps, key);
    if (typeof value === 'string') {
      Reflect.set(result, key, value);
    }
  }

  return result;
};
