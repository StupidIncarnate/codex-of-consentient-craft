/**
 * PURPOSE: Resolves the absolute path to a guild folder under the dungeonmaster home guilds directory
 *
 * USAGE:
 * locationsGuildPathFindBroker({ guildId: GuildIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsGuildPathFindBroker = ({
  guildId,
}: {
  guildId: Guild['id'];
}): string => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.guildsDir, guildId);

  return joined;
};
