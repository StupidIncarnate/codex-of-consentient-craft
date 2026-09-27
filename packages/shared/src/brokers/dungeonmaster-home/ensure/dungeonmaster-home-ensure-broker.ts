/**
 * PURPOSE: Creates ~/.dungeonmaster/ and ~/.dungeonmaster/guilds/ directories if they do not exist
 *
 * USAGE:
 * const { homePath, guildsPath } = await dungeonmasterHomeEnsureBroker();
 * // Creates both directories and returns their paths
 */

import { ensureDir } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import { dungeonmasterHomeFindBroker } from '../find/dungeonmaster-home-find-broker';

export const dungeonmasterHomeEnsureBroker = async (): Promise<{
  homePath: FilePath;
  guildsPath: FilePath;
}> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  await ensureDir(homePath);

  const guildsPath = filePathContract.parse(
    join(homePath, dungeonmasterHomeStatics.paths.guildsDir),
  );

  await ensureDir(guildsPath);

  return { homePath, guildsPath };
};
