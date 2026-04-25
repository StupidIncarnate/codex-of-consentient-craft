/**
 * PURPOSE: Resolves the absolute path to a guild folder under the dungeonmaster home guilds directory
 *
 * USAGE:
 * locationsGuildPathFindBroker({ guildId: GuildIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { GuildId } from '../../../contracts/guild-id/guild-id-contract';

export const locationsGuildPathFindBroker = ({
  guildId,
}: {
  guildId: GuildId;
}): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.guildsDir, guildId],
  });

  return absoluteFilePathContract.parse(joined);
};
