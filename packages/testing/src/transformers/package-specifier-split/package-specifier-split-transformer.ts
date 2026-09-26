/**
 * PURPOSE: Splits an import specifier into its package name and subpath halves — the same split
 * Node performs before consulting a package's own `exports` map. Returns null for a specifier with
 * no subpath ('some-package', 'axios'), which is never a workspace package's subpath import.
 *
 * USAGE:
 * packageSpecifierSplitTransformer({ importPath: importPathContract.parse('@dungeonmaster/bin/testing') });
 * // Returns { packageName: '@dungeonmaster/bin', subpath: 'testing' }
 */

import { packageSpecifierPartsContract } from '../../contracts/package-specifier-parts/package-specifier-parts-contract';
import type { PackageSpecifierParts } from '../../contracts/package-specifier-parts/package-specifier-parts-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

// Scoped (`@scope/name`) or unscoped (`name`) package specifier, followed by its subpath.
const PACKAGE_SPECIFIER_PATTERN = /^(@[^/]+\/[^/]+|[^@/]+)\/(.+)$/u;

export const packageSpecifierSplitTransformer = ({
  importPath,
}: {
  importPath: ImportPath;
}): PackageSpecifierParts | null => {
  const match = PACKAGE_SPECIFIER_PATTERN.exec(importPath);
  if (!match) {
    return null;
  }

  const [, packageName, subpath] = match;
  if (!packageName || !subpath) {
    return null;
  }

  return packageSpecifierPartsContract.parse({ packageName, subpath });
};
