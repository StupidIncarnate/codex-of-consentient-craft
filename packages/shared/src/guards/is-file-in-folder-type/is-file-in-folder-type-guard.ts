/**
 * PURPOSE: Returns true when an absolute file path falls under a specific folder type within a package's src directory
 *
 * USAGE:
 * isFileInFolderTypeGuard({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/flows/quest/quest-flow.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 *   folderType: 'flows',
 * });
 * // Returns true
 *
 * WHEN-TO-USE: Boot-tree broker filtering resolved import paths by folder type (flows, responders, adapters)
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';

export const isFileInFolderTypeGuard = ({
  filePath,
  packageSrcPath,
  folderType,
}: {
  filePath?: AbsoluteFilePath;
  packageSrcPath?: AbsoluteFilePath;
  folderType?: string;
}): boolean => {
  if (filePath === undefined || packageSrcPath === undefined || folderType === undefined) {
    return false;
  }
  const prefix = `${String(packageSrcPath)}/${folderType}/`;
  return String(filePath).startsWith(prefix);
};
