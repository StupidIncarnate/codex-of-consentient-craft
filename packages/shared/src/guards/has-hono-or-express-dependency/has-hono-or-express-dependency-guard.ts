/**
 * PURPOSE: Returns true when package.json dependencies include 'hono' or 'express'. The
 * declared-dependency counterpart to `hasHonoOrExpressAdapterGuard`, for a package that has no
 * `src/adapters/hono/` folder and whose flow does not construct the app itself. Callers pair it with
 * a flows folder: the `@gateway/npm` package also lists hono, and has no flows.
 *
 * USAGE:
 * hasHonoOrExpressDependencyGuard({ packageJson: PackageJsonStub({ dependencies: { hono: '^4.0.0' } }) });
 * // Returns true — 'hono' is in dependencies
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

export const hasHonoOrExpressDependencyGuard = ({
  packageJson,
}: {
  packageJson?: PackageJson;
}): boolean => {
  if (packageJson === undefined) {
    return false;
  }
  const { dependencies } = packageJson;
  if (dependencies === undefined) {
    return false;
  }
  return (
    Reflect.get(dependencies, 'hono') !== undefined ||
    Reflect.get(dependencies, 'express') !== undefined
  );
};
