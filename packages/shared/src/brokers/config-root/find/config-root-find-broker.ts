/**
 * PURPOSE: Finds the project config root by searching up the directory tree for a .dungeonmaster.json file
 *
 * USAGE:
 * await configRootFindBroker({startPath: FilePathStub({value: '/project/packages/web/src/file.ts'})});
 * // Returns FilePath to the directory containing .dungeonmaster.json
 */

import { pathExists } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';

export const configRootFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? startPath;

  const configPath = join(searchPath, dungeonmasterHomeStatics.paths.projectConfigFile);

  if (await pathExists(configPath)) {
    return searchPath;
  }

  const parentPath = filePathContract.parse(dirname(searchPath));
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return configRootFindBroker({ startPath, currentPath: parentPath });
};
