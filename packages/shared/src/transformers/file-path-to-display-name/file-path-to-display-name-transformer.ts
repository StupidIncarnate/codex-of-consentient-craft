/**
 * PURPOSE: Converts an absolute file path to a display name by stripping the package src prefix
 * and removing the .ts extension
 *
 * USAGE:
 * filePathToDisplayNameTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/flows/quest/quest-flow.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns ContentText 'flows/quest/quest-flow'
 *
 * WHEN-TO-USE: Boot-tree renderer converting absolute file paths to human-readable relative
 * display names for the rendered output
 */

export const filePathToDisplayNameTransformer = ({
  filePath,
  packageSrcPath,
}: {
  filePath: string;
  packageSrcPath: string;
}): string => {
  const prefix = `${packageSrcPath}/`;
  const relative = filePath.startsWith(prefix) ? filePath.slice(prefix.length) : filePath;

  const withoutExt = relative.endsWith('.tsx')
    ? relative.slice(0, relative.length - '.tsx'.length)
    : relative.endsWith('.ts')
      ? relative.slice(0, relative.length - '.ts'.length)
      : relative;

  return withoutExt;
};
