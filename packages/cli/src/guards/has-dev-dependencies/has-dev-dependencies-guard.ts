/**
 * PURPOSE: Type guard to check if an object has a devDependencies property
 *
 * USAGE:
 * if (hasDevDependenciesGuard({obj: parsedPackageJson})) {
 *   // parsedPackageJson.devDependencies is typed as DependencyMap
 * }
 */

import type { DependencyMap } from '../../contracts/dependency-map/dependency-map-contract';

export const hasDevDependenciesGuard = (params?: {
  obj?: unknown;
}): params is { obj: { devDependencies: DependencyMap } } => {
  const obj = params?.obj;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'devDependencies' in obj &&
    typeof Reflect.get(obj, 'devDependencies') === 'object' &&
    Reflect.get(obj, 'devDependencies') !== null
  );
};
