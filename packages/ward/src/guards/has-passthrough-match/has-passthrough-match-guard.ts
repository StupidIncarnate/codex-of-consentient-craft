/**
 * PURPOSE: Checks if a passthrough arg path belongs to a given package folder
 *
 * USAGE:
 * hasPassthroughMatchGuard({passthroughArg, projectFolder, rootPath});
 * // Returns true if the passthrough arg starts with the package's relative path prefix
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { CliArg } from '../../contracts/cli-arg/cli-arg-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import { isPathUnderDirectoryGuard } from '../is-path-under-directory/is-path-under-directory-guard';

export const hasPassthroughMatchGuard = ({
  passthroughArg,
  projectFolder,
  rootPath,
}: {
  passthroughArg?: CliArg;
  projectFolder?: ProjectFolder;
  rootPath?: AbsoluteFilePath;
}): boolean => {
  if (!passthroughArg || !projectFolder || !rootPath) {
    return false;
  }

  const relativePath = projectFolder.path.slice(rootPath.length + 1);

  return isPathUnderDirectoryGuard({ path: String(passthroughArg), directory: relativePath });
};
