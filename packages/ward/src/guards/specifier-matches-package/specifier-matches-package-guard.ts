/**
 * PURPOSE: Answers whether an import specifier belongs to a named package — either the bare
 * package name itself, or one of its subpaths. Shared by the workspace-package resolver (find
 * which known package a bare specifier names) and the gateway-crossing check (does this specifier
 * cross into `@scope/node` or `@scope/browser`), so the two never drift on what "belongs to"
 * means.
 *
 * USAGE:
 * specifierMatchesPackageGuard({specifier: '@dungeonmaster/node/fs', packageName: '@dungeonmaster/node'});
 * // Returns: true
 */

export const specifierMatchesPackageGuard = ({
  specifier,
  packageName,
}: {
  specifier?: string;
  packageName?: string;
}): boolean => {
  if (specifier === undefined || packageName === undefined) {
    return false;
  }
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
};
