/**
 * PURPOSE: Turns a bare workspace specifier (`@dungeonmaster/shared2/brokers`) — or its `#gateway/`
 * spelling (`#gateway/node/fs`) — into the file-system target it names. Canonicalizes a gateway
 * specifier to the real package name first, then finds which known workspace package's name the
 * result starts with and appends the remaining subpath onto that package's own folder. A gateway
 * package's own subpaths live under `src/` (its `package.json` `exports` maps every subpath's
 * wildcard into a `src` folder holding an `index.ts`), unlike an ordinary workspace package's
 * root-level barrel files, so a matched gateway package gets that extra segment. Returns `undefined`
 * for a specifier that names no known package — a third-party npm package, or a workspace package
 * the walk never discovered.
 *
 * USAGE:
 * targetPathFromBareSpecifierTransformer({
 *   specifier: ModuleSpecifierStub({value: '@dungeonmaster/shared2/brokers'}),
 *   knownPackages: [ProjectFolderStub({name: '@dungeonmaster/shared2', path: '/repo/packages/shared2'})],
 * });
 * // Returns: '/repo/packages/shared2/brokers' as FilePath
 * targetPathFromBareSpecifierTransformer({
 *   specifier: ModuleSpecifierStub({value: '#gateway/node/fs'}),
 *   knownPackages: [ProjectFolderStub({name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node'})],
 * });
 * // Returns: '/repo/packages/@gateway/node/src/fs' as FilePath
 */


import type { ModuleSpecifier } from '../../contracts/module-specifier/module-specifier-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import { specifierMatchesPackageGuard } from '../../guards/specifier-matches-package/specifier-matches-package-guard';
import { isGatewayPackageProjectFolderGuard } from '../../guards/is-gateway-package-project-folder/is-gateway-package-project-folder-guard';
import { gatewaySpecifierCanonicalizeTransformer } from '../gateway-specifier-canonicalize/gateway-specifier-canonicalize-transformer';

export const targetPathFromBareSpecifierTransformer = ({
  specifier,
  knownPackages,
}: {
  specifier: ModuleSpecifier;
  knownPackages: readonly ProjectFolder[];
}): string | undefined => {
  const canonicalSpecifier = gatewaySpecifierCanonicalizeTransformer({ specifier, knownPackages });

  const matchedPackage = knownPackages.find((projectFolder) =>
    specifierMatchesPackageGuard({
      specifier: canonicalSpecifier,
      packageName: projectFolder.name,
    }),
  );
  if (matchedPackage === undefined) {
    return undefined;
  }

  const subpath = canonicalSpecifier.slice(matchedPackage.name.length);
  const packageRoot = isGatewayPackageProjectFolderGuard({ projectFolder: matchedPackage })
    ? `${matchedPackage.path}/src`
    : matchedPackage.path;

  return (subpath === '' ? packageRoot : `${packageRoot}${subpath}`);
};
