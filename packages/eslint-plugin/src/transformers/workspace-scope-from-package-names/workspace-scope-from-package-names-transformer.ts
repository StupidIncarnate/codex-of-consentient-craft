/**
 * PURPOSE: Extracts THIS workspace's own npm scope (`@dungeonmaster`, `@acme`, …) from the real
 * package-name list `findWorkspaceRootLayerBroker` reads off the workspace root's own package.json.
 * Every workspace package shares one scope by this repo's own convention (packages/CLAUDE.md,
 * "Depending on another workspace package": `"@dungeonmaster/shared": "*"`), so the first SCOPED
 * name in the list names it for a consumer repo too, whatever THEY call their own scope — never a
 * hardcoded `@dungeonmaster`, which would only ever match this repo and never a published
 * consumer's own workspace. Returns undefined when no name in the list is scoped at all — a
 * workspace with no scope has no `@scope/pkg` bare-root import form to recognize in the first place.
 *
 * USAGE:
 * workspaceScopeFromPackageNamesTransformer({ packageNames: [PackageNameStub({ value: '@acme/orders' })] });
 * // Returns '@acme' as a branded PathSegment
 */
import type { PackageName, PathSegment } from '@dungeonmaster/shared/contracts';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';

export const workspaceScopeFromPackageNamesTransformer = ({
  packageNames,
}: {
  packageNames: PackageName[];
}): PathSegment | undefined => {
  for (const name of packageNames) {
    const match = /^(@[\w-]+)\//u.exec(name);
    if (match?.[1] !== undefined) {
      return pathSegmentContract.parse(match[1]);
    }
  }
  return undefined;
};
