/**
 * PURPOSE: Returns true when package.json dependencies include 'ink'. The declared-dependency
 * counterpart to `hasInkAdapterGuard`: a package that renders through a `#gateway/npm/ink` wrapper
 * (or has not written one yet) carries no `src/adapters/ink/` folder, so ink detection needs both.
 *
 * USAGE:
 * hasInkDependencyGuard({ packageJson: PackageJsonStub({ dependencies: { ink: '^5.0.0' } }) });
 * // Returns true — 'ink' is in dependencies
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

export const hasInkDependencyGuard = ({ packageJson }: { packageJson?: PackageJson }): boolean => {
  if (packageJson === undefined) {
    return false;
  }
  const { dependencies } = packageJson;
  if (dependencies === undefined) {
    return false;
  }
  return Reflect.get(dependencies, 'ink') !== undefined;
};
