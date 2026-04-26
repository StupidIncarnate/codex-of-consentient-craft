/**
 * PURPOSE: Resolves the absolute path to a guild's guild.json config file
 *
 * USAGE:
 * locationsGuildConfigPathFindBroker({ guildId: GuildIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>/guild.json'
 */

import { locationsGuildPathFindBroker } from '../guild-path-find/locations-guild-path-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { GuildId } from '../../../contracts/guild-id/guild-id-contract';

export const locationsGuildConfigPathFindBroker = ({
  guildId,
}: {
  guildId: GuildId;
}): AbsoluteFilePath => {
  const guildPath = locationsGuildPathFindBroker({ guildId });

  const joined = pathJoinAdapter({
    paths: [guildPath, locationsStatics.dungeonmasterHome.guildConfigFile],
  });

  return absoluteFilePathContract.parse(joined);
};
