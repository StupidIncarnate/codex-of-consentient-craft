/**
 * PURPOSE: Extracts THIS workspace's own npm scope (`@dungeonmaster`, `@acme`, …) from the real
 * workspace root's own package.json `name` field — `findWorkspaceRootLayerBroker` reads it off the
 * workspace root a bare `@scope/pkg` import's scope is checked against. A scoped name (`@acme/app`)
 * keeps its own scope prefix; an unscoped name (`dungeonmaster`, `acme-app`) becomes its own scope
 * with a leading `@` (`@dungeonmaster`, `@acme-app`) — the same derivation `cli`'s
 * `gatewayScopeDetectTransformer` uses to NAME the gateway packages `dungeonmaster init` scaffolds in
 * the first place. Never a scan of root `dependencies`/`devDependencies`: a consumer's root
 * `devDependencies` carry `@dungeonmaster/*` tooling `dungeonmaster init` installs, and a fresh
 * consumer with no workspace package registered to root `dependencies` yet has nothing else scoped
 * there — a dependency scan would misread the TOOL VENDOR's scope as the consumer's own.
 *
 * USAGE:
 * workspaceScopeFromRootNameTransformer({ rootPackageJsonName: PackageNameStub({ value: '@acme/app' }) });
 * // Returns '@acme' as a branded PathSegment
 * workspaceScopeFromRootNameTransformer({ rootPackageJsonName: PackageNameStub({ value: 'acme-app' }) });
 * // Returns '@acme-app' as a branded PathSegment
 */
import type { PackageName, PathSegment } from '@dungeonmaster/shared/contracts';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';

export const workspaceScopeFromRootNameTransformer = ({
  rootPackageJsonName,
}: {
  rootPackageJsonName: PackageName | undefined;
}): PathSegment | undefined => {
  if (rootPackageJsonName === undefined) {
    return undefined;
  }

  const scope =
    rootPackageJsonName.startsWith('@') && rootPackageJsonName.includes('/')
      ? rootPackageJsonName.slice(0, rootPackageJsonName.indexOf('/'))
      : `@${rootPackageJsonName}`;

  return pathSegmentContract.parse(scope);
};
