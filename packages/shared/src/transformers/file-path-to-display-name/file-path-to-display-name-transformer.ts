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

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

export const filePathToDisplayNameTransformer = ({
  filePath,
  packageSrcPath,
}: {
  filePath: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
}): ContentText => {
  const prefix = `${String(packageSrcPath)}/`;
  const relative = String(filePath).startsWith(prefix)
    ? String(filePath).slice(prefix.length)
    : String(filePath);

  const withoutExt = relative.endsWith('.tsx')
    ? relative.slice(0, relative.length - '.tsx'.length)
    : relative.endsWith('.ts')
      ? relative.slice(0, relative.length - '.ts'.length)
      : relative;

  return contentTextContract.parse(withoutExt);
};
