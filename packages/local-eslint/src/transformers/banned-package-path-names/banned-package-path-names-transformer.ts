/**
 * PURPOSE: Finds the package names that a piece of text spells out either as a workspace path
 * (`packages/<name>`) or as a scoped npm specifier (`@scope/<name>`) — the two shapes that survive
 * a copy-paste into another repo and quietly mean the wrong package there. Reach for this rather
 * than a substring search: it anchors on the workspace directory segment or the scope separator,
 * so a bare role word with no path context (`web`) and a longer sibling in either shape
 * (`packages/webhooks`, `@scope/webhooks`) do not match.
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

  const workspacePathAlternation = workspaceDirNames.join('|');
  const packageNameAlternation = packageNames.join('|');

  // A scoped specifier's TEXT is byte-identical whether its parent is an import or a plain
  // assignment — this function sees only the string, never the parent node. Matching it here
  // unconditionally is safe only because the sole caller, ruleNoHardcodedPackageNamesBroker,
  // withholds any literal whose parent is an ImportDeclaration, an ImportExpression, or a
  // require() call before its text ever reaches here, so a real import specifier never appears in
  // `text`. Do not try to detect import syntax in this pattern — the parent node is the only place
  // that distinction exists, and an earlier attempt at reading it from the text alone flagged real
  // imports.
  const pattern = new RegExp(
    `(?<![A-Za-z0-9_-])(?:(?:${workspacePathAlternation})/(${packageNameAlternation})|@[A-Za-z0-9][A-Za-z0-9._-]*/(${packageNameAlternation}))(?![A-Za-z0-9_-])`,
    'gu',
  );

  const seen = new Set<PackageName>();
  const found: PackageName[] = [];

  for (const match of text.matchAll(pattern)) {
    const [, workspacePathName, scopedSpecifierName] = match;
    const name = workspacePathName ?? scopedSpecifierName;
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
