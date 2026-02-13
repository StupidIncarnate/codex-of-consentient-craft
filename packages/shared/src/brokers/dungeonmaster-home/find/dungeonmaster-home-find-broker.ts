/**
 * PURPOSE: Resolves the ~/.dungeonmaster path by joining the user home directory with the config dir name
 *
 * USAGE:
 * const { homePath } = dungeonmasterHomeFindBroker();
 * // Returns { homePath: FilePath } pointing to ~/.dungeonmaster
 */

import { osHomedirAdapter } from '../../../adapters/os/homedir/os-homedir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const dungeonmasterHomeFindBroker = (): { homePath: FilePath } => {
  const homeDir = osHomedirAdapter();

  const homePath = pathJoinAdapter({
    paths: [homeDir, dungeonmasterHomeStatics.paths.configDir],
  });

  return { homePath };
};
