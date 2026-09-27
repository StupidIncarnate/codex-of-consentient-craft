/**
 * PURPOSE: A real, on-disk package root path, produced by actually calling
 * `#gateway/node/module`'s own `resolvePackageRoot` against `zod` — a real dependency of this
 * gateway package itself (see `package.json`), so the resolution always has something real to
 * find, in this monorepo and in any consumer repo alike.
 *
 * USAGE:
 * const root = PackageRootPathStub();
 * // Returns the absolute path to zod's installed package root
 */
import { resolvePackageRoot } from './resolve-package-root';

export const PackageRootPathStub = ({ specifier = 'zod' }: { specifier?: string } = {}): string => {
  const root = resolvePackageRoot({ specifier });

  if (root === null) {
    throw new Error(
      `PackageRootPathStub: resolvePackageRoot({specifier: '${specifier}'}) returned null — is '${specifier}' installed?`,
    );
  }

  return root;
};
