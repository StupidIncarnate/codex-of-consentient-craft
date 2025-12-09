/**
 * PURPOSE: Finds the nearest .dungeonmaster config file by searching up the directory tree
 *
 * USAGE:
 * await configFileFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to nearest .dungeonmaster file
 */

import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';
import type { FilePath } from '@dungeonmaster/shared/contracts';

const CONFIG_FILENAME = '.dungeonmaster';
const R_OK = 4;

export const configFileFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? pathDirnameAdapter({ path: startPath });

  const configPath = pathJoinAdapter({
    paths: [searchPath, CONFIG_FILENAME],
  });

  // Check if config file exists at this level
  try {
    await fsAccessAdapter({ filePath: configPath, mode: R_OK });
    return configPath;
  } catch {
    // Config doesn't exist at this level, check parent
  }

  // Check if we've reached the root directory
  const parentPath = pathDirnameAdapter({ path: searchPath });
  if (parentPath === searchPath) {
    // We've reached the root directory without finding config
    throw new ConfigNotFoundError({ startPath });
  }

  // Recurse to parent directory
  return configFileFindBroker({ startPath, currentPath: parentPath });
};
