/**
 * PURPOSE: Resolves the absolute path to a single quest's folder under a guild's quests directory
 *
 * USAGE:
 * locationsQuestFolderPathFindBroker({ guildId: GuildIdStub(), questId: QuestIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>/quests/<questId>'
 */

import { locationsGuildQuestsPathFindBroker } from '../guild-quests-path-find/locations-guild-quests-path-find-broker';
import { join } from '#gateway/node/path';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { GuildId } from '../../../contracts/guild-id/guild-id-contract';
import type { Quest } from '../../../contracts/quest/quest-contract';

export const locationsQuestFolderPathFindBroker = ({
  guildId,
  questId,
}: {
  guildId: GuildId;
  questId: Quest['id'];
}): AbsoluteFilePath => {
  const guildQuestsPath = locationsGuildQuestsPathFindBroker({ guildId });

  const joined = join(guildQuestsPath, questId);

  return absoluteFilePathContract.parse(joined);
};
