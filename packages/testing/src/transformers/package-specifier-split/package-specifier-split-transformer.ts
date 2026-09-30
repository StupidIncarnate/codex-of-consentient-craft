/**
 * PURPOSE: Splits an import specifier into its package name and subpath halves — the same split
 * Node performs before consulting a package's own `exports` map. Returns null for a specifier with
 * no subpath ('some-package', 'axios'), which is never a workspace package's subpath import.
 * Returns null for a `#`-prefixed specifier ('#gateway/npm/glob/glob/glob.proxy') too — that is a package's own
 * `imports`-map key, not a package name, and the unscoped branch below would otherwise mis-split it
 * into a package literally named `#gateway`; packageImportsSpecifierResolveMiddleware substitutes
 * a `#`-specifier's TARGET before it ever reaches this function.
 *
 * USAGE:
 * packageSpecifierSplitTransformer({ importPath: '@dungeonmaster/bin/testing' });
 * // Returns { packageName: '@dungeonmaster/bin', subpath: 'testing' }
 */

import { packageSpecifierPartsContract } from '../../contracts/package-specifier-parts/package-specifier-parts-contract';
import type { PackageSpecifierParts } from '../../contracts/package-specifier-parts/package-specifier-parts-contract';

// Scoped (`@scope/name`) or unscoped (`name`) package specifier, followed by its subpath.
const PACKAGE_SPECIFIER_PATTERN = /^(@[^/]+\/[^/]+|[^@/]+)\/(.+)$/u;
const IMPORTS_MAP_SPECIFIER_PREFIX = '#';

export const packageSpecifierSplitTransformer = ({
  importPath,
}: {
  importPath: string;
}): PackageSpecifierParts | null => {
  if (importPath.startsWith(IMPORTS_MAP_SPECIFIER_PREFIX)) {
    return null;
  }

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
