/**
 * PURPOSE: Resolves the absolute path to a guild's quests directory
 *
 * USAGE:
 * locationsGuildQuestsPathFindBroker({ guildId: GuildIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>/quests'
 */

import { locationsGuildPathFindBroker } from '../guild-path-find/locations-guild-path-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsGuildQuestsPathFindBroker = ({
  guildId,
}: {
  guildId: Guild['id'];
}): string => {
  const guildPath = locationsGuildPathFindBroker({ guildId });

  const joined = join(guildPath, locationsStatics.guild.questsDir);

  return joined;
};
