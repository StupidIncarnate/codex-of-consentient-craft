/**
 * PURPOSE: Whether a package.json dependency map already takes some `@dungeonmaster/*` package
 * through a `file:` specifier — the sign that this consumer runs dungeonmaster from a local
 * checkout, so a newly added `@dungeonmaster/*` entry must point at that checkout too rather than
 * at the registry.
 *
 * USAGE:
 * hasLocalDungeonmasterDependencyGuard({ dependencies: { '@dungeonmaster/cli': 'file:../dm/packages/cli' } });
 * // Returns true
 */

import type { DependencyMap } from '../../contracts/dependency-map/dependency-map-contract';
import { devDependenciesStatics } from '../../statics/dev-dependencies/dev-dependencies-statics';

export const hasLocalDungeonmasterDependencyGuard = ({
  dependencies,
}: {
  dependencies?: DependencyMap;
}): boolean => {
  if (dependencies === undefined) {
    return false;
  }

  const { scope, prefix } = devDependenciesStatics.localSpecifier;

  return Object.entries(dependencies).some(
    ([name, specifier]) => name.startsWith(scope) && specifier.startsWith(prefix),
  );
};
