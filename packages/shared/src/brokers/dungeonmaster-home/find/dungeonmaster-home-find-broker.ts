/**
 * PURPOSE: Resolves the ~/.dungeonmaster path by joining the user home directory with the config dir name
 *
 * USAGE:
 * const { homePath } = dungeonmasterHomeFindBroker();
 * // Returns { homePath: FilePath } pointing to ~/.dungeonmaster
 */

import { osHomedirAdapter } from '../../../adapters/os/homedir/os-homedir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { environmentStatics } from '../../../statics/environment/environment-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const dungeonmasterHomeFindBroker = (): { homePath: FilePath } => {
  const homeDir = osHomedirAdapter();

  const dirName =
    process.env.DUNGEONMASTER_ENV === 'dev'
      ? environmentStatics.devDataDir
      : environmentStatics.dataDir;

  const homePath = pathJoinAdapter({
    paths: [homeDir, dirName],
  });

  return { homePath };
};
