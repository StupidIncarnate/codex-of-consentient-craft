/**
 * PURPOSE: Creates ~/.dungeonmaster/ and ~/.dungeonmaster/guilds/ directories if they do not exist
 *
 * USAGE:
 * const { homePath, guildsPath } = await dungeonmasterHomeEnsureBroker();
 * // Creates both directories and returns their paths
 */

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import { dungeonmasterHomeFindBroker } from '../find/dungeonmaster-home-find-broker';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const dungeonmasterHomeEnsureBroker = async (): Promise<{
  homePath: FilePath;
  guildsPath: FilePath;
}> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  await fsMkdirAdapter({ filepath: homePath });

  const guildsPath = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.guildsDir],
  });

  await fsMkdirAdapter({ filepath: guildsPath });

  return { homePath, guildsPath };
};
