/**
 * PURPOSE: Finds the project config root by searching up the directory tree for a .dungeonmaster.json (preferred) or .dungeonmaster (legacy) file
 *
 * USAGE:
 * await configRootFindBroker({startPath: FilePathStub({value: '/project/packages/web/src/file.ts'})});
 * // Returns FilePath to the directory containing .dungeonmaster.json or .dungeonmaster
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

  const preferredPath = pathJoinAdapter({
    paths: [searchPath, dungeonmasterHomeStatics.paths.projectConfigFile],
  });

  try {
    await fsAccessAdapter({ filePath: preferredPath, mode: R_OK });
    return searchPath;
  } catch {
    // .dungeonmaster.json not here — try legacy filename before walking up
  }

  const legacyPath = pathJoinAdapter({
    paths: [searchPath, dungeonmasterHomeStatics.paths.legacyProjectConfigFile],
  });

  try {
    await fsAccessAdapter({ filePath: legacyPath, mode: R_OK });
    return searchPath;
  } catch {
    // neither filename at this level, check parent
  }

  const parentPath = pathDirnameAdapter({ path: searchPath });
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return configRootFindBroker({ startPath, currentPath: parentPath });
};
