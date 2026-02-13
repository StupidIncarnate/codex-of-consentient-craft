/**
 * PURPOSE: Creates ~/.dungeonmaster/ and ~/.dungeonmaster/projects/ directories if they do not exist
 *
 * USAGE:
 * const { homePath, projectsPath } = await dungeonmasterHomeEnsureBroker();
 * // Creates both directories and returns their paths
 */

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';
import { dungeonmasterHomeFindBroker } from '../find/dungeonmaster-home-find-broker';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const dungeonmasterHomeEnsureBroker = async (): Promise<{
  homePath: FilePath;
  projectsPath: FilePath;
}> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  await fsMkdirAdapter({ filepath: homePath });

  const projectsPath = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.projectsDir],
  });

  await fsMkdirAdapter({ filepath: projectsPath });

  return { homePath, projectsPath };
};
