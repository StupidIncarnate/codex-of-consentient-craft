/**
 * PURPOSE: Resolves the absolute path to a single quest's folder under a guild's quests directory
 *
 * USAGE:
 * locationsQuestFolderPathFindBroker({ guildId: GuildIdStub(), questId: QuestIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>/quests/<questId>'
 */

import { locationsGuildQuestsPathFindBroker } from '../guild-quests-path-find/locations-guild-quests-path-find-broker';
import { join } from '#gateway/node/path';
import type { Quest } from '../../../contracts/quest/quest-contract';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsQuestFolderPathFindBroker = ({
  guildId,
  questId,
}: {
  guildId: Guild['id'];
  questId: Quest['id'];
}): string => {
  const guildQuestsPath = locationsGuildQuestsPathFindBroker({ guildId });

  const joined = join(guildQuestsPath, questId);

  return joined;
};
