/**
 * PURPOSE: Finds the nearest .dungeonmaster.json config file by searching up the directory tree
 *
 * USAGE:
 * await configFileFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to nearest .dungeonmaster.json
 */

import { configRootFindBroker } from '@dungeonmaster/shared/brokers';
import { dirname, join } from '#gateway/node/path';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { ConfigNotFoundError } from '../../../errors/config-not-found/config-not-found-error';

export const configFileFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: string;
  currentPath?: string;
}): Promise<string> => {
  const searchPath = currentPath ?? dirname(startPath);

  try {
    const rootDir = await configRootFindBroker({ startPath: searchPath });

    return join(rootDir, dungeonmasterHomeStatics.paths.projectConfigFile);
  } catch {
    throw new ConfigNotFoundError({ startPath });
  }
};
