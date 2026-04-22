/**
 * PURPOSE: Finds the project config root by searching up the directory tree for a .dungeonmaster.json file
 *
 * USAGE:
 * await configRootFindBroker({startPath: FilePathStub({value: '/project/packages/web/src/file.ts'})});
 * // Returns FilePath to the directory containing .dungeonmaster.json
 */

import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const R_OK = 4;

export const configRootFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? startPath;

  const configPath = pathJoinAdapter({
    paths: [searchPath, dungeonmasterHomeStatics.paths.projectConfigFile],
  });

  try {
    await fsAccessAdapter({ filePath: configPath, mode: R_OK });
    return searchPath;
  } catch {
    // not here, check parent
  }

  const parentPath = pathDirnameAdapter({ path: searchPath });
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return configRootFindBroker({ startPath, currentPath: parentPath });
};
