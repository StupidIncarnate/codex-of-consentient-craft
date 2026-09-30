/**
 * PURPOSE: Extracts a workspace's own npm scope (`@dungeonmaster`, `@acme`, …) from its root
 * package.json `name` field, tolerating the two things a real workspace root can hand back that
 * `packageScopeFromNameTransformer` cannot: an absent/empty name, and a caller-supplied fallback to
 * derive one from instead (a fresh consumer's root package.json may have no `name` yet). Delegates
 * the actual `@scope/pkg` split to `packageScopeFromNameTransformer` rather than re-deriving it, so
 * that splitting rule keeps exactly one home. Reach for this over calling
 * `packageScopeFromNameTransformer` directly whenever the root name might be missing; reach for
 * `packageScopeFromNameTransformer` directly when you already know you have one. Never a scan of root
 * `dependencies`/`devDependencies`: a consumer's own `devDependencies` carry the tool vendor's
 * `@dungeonmaster/*` scope, not the consumer's own.
 *
 * USAGE:
 * workspaceScopeFromRootNameTransformer({ rootPackageJsonName: PackageNameStub({ value: '@acme/app' }) });
 * // Returns '@acme' as a branded PathSegment
 * workspaceScopeFromRootNameTransformer({ rootPackageJsonName: undefined, fallbackName: PathSegmentStub({ value: 'my-repo' }) });
 * // Returns '@my-repo' as a branded PathSegment — the fallback stands in for a missing/empty name
 * workspaceScopeFromRootNameTransformer({ rootPackageJsonName: undefined });
 * // Returns undefined — nothing to derive a scope from
 */
import { packageScopeFromNameTransformer } from '../package-scope-from-name/package-scope-from-name-transformer';

export const workspaceScopeFromRootNameTransformer = ({
  rootPackageJsonName,
  fallbackName,
}: {
  rootPackageJsonName: string | undefined;
  fallbackName?: string;
}): string | undefined => {
  const candidate =
    rootPackageJsonName !== undefined && rootPackageJsonName.length > 0
      ? rootPackageJsonName
      : fallbackName;

  if (candidate === undefined) {
    return undefined;
  }

  return packageScopeFromNameTransformer({ rootPackageName: candidate });
};
