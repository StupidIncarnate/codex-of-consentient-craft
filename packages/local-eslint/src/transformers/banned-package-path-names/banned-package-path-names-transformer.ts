/**
 * PURPOSE: Finds the package names that a piece of text spells out as a workspace path (`packages/<name>`), which is the shape that survives a copy-paste into another repo and quietly means the wrong package there. Reach for this rather than a substring search: it anchors on the workspace directory segment, so a module specifier (`@scope/web`) and a longer sibling (`packages/webhooks`) do not match.
 *
 * USAGE:
 * bannedPackagePathNamesTransformer({
 *   text: "const root = 'packages/web/src/brokers';",
 *   packageNames: ['web', 'server'],
 *   workspaceDirNames: ['packages'],
 * });
 * // Returns [PackageName('web')]
 *
 * WHEN-TO-USE: Only the no-hardcoded-package-names rule should call this.
 */
import { packageNameContract } from '@dungeonmaster/shared/contracts';
import type { PackageName } from '@dungeonmaster/shared/contracts';

export const bannedPackagePathNamesTransformer = ({
  text,
  packageNames,
  workspaceDirNames,
}: {
  text: string;
  packageNames: readonly string[];
  workspaceDirNames: readonly string[];
}): PackageName[] => {
  if (packageNames.length === 0 || workspaceDirNames.length === 0) {
    return [];
  }

  const pattern = new RegExp(
    `(?<![A-Za-z0-9_-])(?:${workspaceDirNames.join('|')})/(${packageNames.join('|')})(?![A-Za-z0-9_-])`,
    'gu',
  );

  const seen = new Set<PackageName>();
  const found: PackageName[] = [];

  for (const match of text.matchAll(pattern)) {
    const [, name] = match;
    if (name !== undefined) {
      const packageName = packageNameContract.parse(name);
      if (!seen.has(packageName)) {
        seen.add(packageName);
        found.push(packageName);
      }
    }
  }

  return found;
};
