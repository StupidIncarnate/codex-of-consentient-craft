/**
 * PURPOSE: Matches an import path against a bare `<workspaceScope>/<pkg>` root form (no
 * folder-type subpath at all) and returns the captured package name, or undefined when the path
 * does not match this workspace's own scope — read off the real workspace root by the caller,
 * never hardcoded, so this recognizes `@acme/orders` in a published consumer exactly as it
 * recognizes `@dungeonmaster/orchestrator` here. Escapes the scope before building the regex,
 * since an npm scope may itself carry a `.` (rare, but a valid npm package-name character) that
 * would otherwise match "any character" instead of a literal dot. Factored out of
 * parseImplementationImportsTransformer to keep its own branch to a single call + `if`.
 *
 * USAGE:
 * workspacePackageRootImportNameTransformer({ importPath: '@acme/orders', workspaceScope: '@acme' });
 * // Returns 'orders' as a branded PathSegment
 */
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';

export const workspacePackageRootImportNameTransformer = ({
  importPath,
  workspaceScope,
}: {
  importPath: string | undefined;
  workspaceScope: string | undefined;
}): PathSegment | undefined => {
  if (workspaceScope === undefined || importPath === undefined) {
    return undefined;
  }
  const escapedScope = workspaceScope.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = new RegExp(`^${escapedScope}\\/([\\w-]+)$`, 'u').exec(importPath);
  return match?.[1] === undefined ? undefined : pathSegmentContract.parse(match[1]);
};
