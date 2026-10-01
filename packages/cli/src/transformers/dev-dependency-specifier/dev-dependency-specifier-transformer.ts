/**
 * PURPOSE: The version specifier `dungeonmaster init` writes for ONE devDependency it adds. A
 * `@dungeonmaster/*` package added beside siblings the target already takes through `file:` gets a
 * `file:` path to that package's directory in the dungeonmaster install running init, relative to
 * the target root; everything else keeps its range from devDependenciesStatics. Never consulted for
 * an entry the target already declares — init leaves those as written.
 *
 * USAGE:
 * devDependencySpecifierTransformer({
 *   packageName: '@dungeonmaster/siegelense',
 *   range: '*',
 *   existingDevDeps: { '@dungeonmaster/cli': 'file:../dm/packages/cli' },
 *   targetProjectRoot: '/home/u/app',
 *   packageDir: '/home/u/dm/packages/siegelense',
 * });
 * // Returns 'file:../dm/packages/siegelense'
 */

import { relative } from '#gateway/node/path';

import type { DependencyMap } from '../../contracts/dependency-map/dependency-map-contract';
import { hasLocalDungeonmasterDependencyGuard } from '../../guards/has-local-dungeonmaster-dependency/has-local-dungeonmaster-dependency-guard';
import { devDependenciesStatics } from '../../statics/dev-dependencies/dev-dependencies-statics';

// A package dir inside the target's own node_modules is an installed copy, not a checkout: a
// `file:` path there points npm at the directory it is about to replace.
const TARGET_NODE_MODULES = /^node_modules(?:\/|$)/u;

export const devDependencySpecifierTransformer = ({
  packageName,
  range,
  existingDevDeps,
  targetProjectRoot,
  packageDir,
}: {
  packageName: string;
  range: string;
  existingDevDeps: DependencyMap;
  targetProjectRoot: string;
  packageDir?: string;
}): string => {
  const { scope, prefix } = devDependenciesStatics.localSpecifier;

  if (
    !packageName.startsWith(scope) ||
    packageDir === undefined ||
    !hasLocalDungeonmasterDependencyGuard({ dependencies: existingDevDeps })
  ) {
    return range;
  }

  const relativeDir = relative(targetProjectRoot, packageDir);

  if (TARGET_NODE_MODULES.test(relativeDir)) {
    return range;
  }

  return `${prefix}${relativeDir}`;
};
