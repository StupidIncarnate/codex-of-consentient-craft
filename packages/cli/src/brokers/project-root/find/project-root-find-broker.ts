/**
 * PURPOSE: Finds the project root by searching up the directory tree for package.json
 *
 * USAGE:
 * await projectRootFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to directory containing package.json
 */

import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { questsFolderStatics } from '../../../statics/quests-folder/quests-folder-statics';
import type { FilePath } from '@dungeonmaster/shared/contracts';

const R_OK = 4;

export const projectRootFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? pathDirnameAdapter({ path: startPath });

  const packageJsonPath = pathJoinAdapter({
    paths: [searchPath, questsFolderStatics.files.packageJson],
  });

  // Check if package.json exists at this level
  try {
    await fsAccessAdapter({ filePath: packageJsonPath, mode: R_OK });
    return searchPath;
  } catch {
    // package.json doesn't exist at this level, check parent
  }

  // Check if we've reached the root directory
  const parentPath = pathDirnameAdapter({ path: searchPath });
  if (parentPath === searchPath) {
    // We've reached the root directory without finding package.json
    throw new ProjectRootNotFoundError({ startPath });
  }

  // Recurse to parent directory
  return projectRootFindBroker({ startPath, currentPath: parentPath });
};
