/**
 * PURPOSE: Finds the project root by searching up the directory tree for package.json
 *
 * USAGE:
 * await projectRootFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // or with directory path:
 * await projectRootFindBroker({startPath: FilePathStub({value: '/project'})});
 * // Returns FilePath to directory containing package.json
 */

import { pathExists } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { questsFolderStatics } from '../../../statics/quests-folder/quests-folder-statics';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

export const projectRootFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  // On first call, check startPath itself first (handles directory paths like process.cwd())
  // Then fall back to parent directory search (handles file paths like /project/src/file.ts)
  const searchPath = currentPath ?? startPath;

  const packageJsonPath = join(searchPath, questsFolderStatics.files.packageJson);

  if (await pathExists(packageJsonPath)) {
    return searchPath;
  }

  // Check if we've reached the root directory
  const parentPath = filePathContract.parse(dirname(searchPath));
  if (parentPath === searchPath) {
    // We've reached the root directory without finding package.json
    throw new ProjectRootNotFoundError({ startPath });
  }

  // Recurse to parent directory
  return projectRootFindBroker({ startPath, currentPath: parentPath });
};
