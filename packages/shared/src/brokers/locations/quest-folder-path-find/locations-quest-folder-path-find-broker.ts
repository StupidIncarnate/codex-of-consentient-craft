/**
 * PURPOSE: Resolves the absolute path to a single quest's folder under a guild's quests directory
 *
 * USAGE:
 * locationsQuestFolderPathFindBroker({ guildId: GuildIdStub(), questId: QuestIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>/quests/<questId>'
 */

import { locationsGuildQuestsPathFindBroker } from '../guild-quests-path-find/locations-guild-quests-path-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { GuildId } from '../../../contracts/guild-id/guild-id-contract';
import type { QuestId } from '../../../contracts/quest-id/quest-id-contract';

export const locationsQuestFolderPathFindBroker = ({
  guildId,
  questId,
}: {
  guildId: GuildId;
  questId: QuestId;
}): AbsoluteFilePath => {
  const guildQuestsPath = locationsGuildQuestsPathFindBroker({ guildId });

  const joined = pathJoinAdapter({
    paths: [guildQuestsPath, questId],
  });

  return absoluteFilePathContract.parse(joined);
};
