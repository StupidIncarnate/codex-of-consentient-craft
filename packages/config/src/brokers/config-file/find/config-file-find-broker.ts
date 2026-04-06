/**
 * PURPOSE: Finds the nearest .dungeonmaster config file by searching up the directory tree
 *
 * USAGE:
 * await configFileFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to nearest .dungeonmaster file
 */

import { configRootFindBroker } from '@dungeonmaster/shared/brokers';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const configFileFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? pathDirnameAdapter({ path: startPath });

  try {
    const rootDir = await configRootFindBroker({ startPath: searchPath });
    return pathJoinAdapter({
      paths: [rootDir, dungeonmasterHomeStatics.paths.configDir],
    });
  } catch {
    throw new ConfigNotFoundError({ startPath });
  }
};
