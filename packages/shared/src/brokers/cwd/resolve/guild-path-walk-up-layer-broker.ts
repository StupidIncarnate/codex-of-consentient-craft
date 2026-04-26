/**
 * PURPOSE: Recursively walks up from a startPath looking for a directory containing guild.json
 *
 * USAGE:
 * await guildPathWalkUpLayerBroker({ startPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds/foo/quests/q1' }) });
 * // Returns FilePath to the directory containing guild.json — throws GuildRootNotFoundError if none found
 */

import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { GuildRootNotFoundError } from '../../../errors/guild-root-not-found/guild-root-not-found-error';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const R_OK = 4;

export const guildPathWalkUpLayerBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? startPath;

  const guildConfigPath = pathJoinAdapter({
    paths: [searchPath, locationsStatics.dungeonmasterHome.guildConfigFile],
  });

  try {
    await fsAccessAdapter({ filePath: guildConfigPath, mode: R_OK });
    return searchPath;
  } catch {
    // not here, check parent
  }

  const parentPath = pathDirnameAdapter({ path: searchPath });
  if (parentPath === searchPath) {
    throw new GuildRootNotFoundError({ startPath });
  }

  return guildPathWalkUpLayerBroker({ startPath, currentPath: parentPath });
};
