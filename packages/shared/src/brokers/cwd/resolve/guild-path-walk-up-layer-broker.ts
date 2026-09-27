/**
 * PURPOSE: Recursively walks up from a startPath looking for a directory containing guild.json
 *
 * USAGE:
 * await guildPathWalkUpLayerBroker({ startPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds/foo/quests/q1' }) });
 * // Returns FilePath to the directory containing guild.json — throws GuildRootNotFoundError if none found
 */

import { pathExists } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';
import { GuildRootNotFoundError } from '../../../errors/guild-root-not-found/guild-root-not-found-error';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const guildPathWalkUpLayerBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<FilePath> => {
  const searchPath = currentPath ?? startPath;

  const guildConfigPath = join(searchPath, locationsStatics.dungeonmasterHome.guildConfigFile);

  if (await pathExists(guildConfigPath)) {
    return searchPath;
  }

  const parentPath = filePathContract.parse(dirname(searchPath));
  if (parentPath === searchPath) {
    throw new GuildRootNotFoundError({ startPath });
  }

  return guildPathWalkUpLayerBroker({ startPath, currentPath: parentPath });
};
