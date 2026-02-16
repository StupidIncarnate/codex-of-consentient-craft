/**
 * PURPOSE: Detects if a given path is inside a sub-package (not the repo root and has a package.json)
 *
 * USAGE:
 * isSubPackageCwdGuard({targetPath: '/repo/packages/ward', rootPath: '/repo', hasPackageJson: true});
 * // Returns true if targetPath is a sub-package, false if it is the repo root or missing package.json
 */

export const isSubPackageCwdGuard = ({
  targetPath,
  rootPath,
  hasPackageJson,
}: {
  targetPath?: string;
  rootPath?: string;
  hasPackageJson?: boolean;
}): boolean => {
  if (!targetPath || !rootPath) {
    return false;
  }

  if (targetPath === rootPath) {
    return false;
  }

  return hasPackageJson === true;
};
