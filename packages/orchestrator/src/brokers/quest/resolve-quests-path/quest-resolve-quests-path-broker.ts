/**
 * PURPOSE: Resolves the quests directory path for a given guild ID within ~/.dungeonmaster/guilds/{guildId}/quests/
 *
 * USAGE:
 * const { questsPath } = await questResolveQuestsPathBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: { questsPath: AbsoluteFilePath } pointing to ~/.dungeonmaster/guilds/{guildId}/quests
 */

import { questResolveQuestsPathResultContract } from '../../../contracts/quest-resolve-quests-path-result/quest-resolve-quests-path-result-contract';
import type { QuestResolveQuestsPathResult } from '../../../contracts/quest-resolve-quests-path-result/quest-resolve-quests-path-result-contract';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import type { Guild } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';

export const questResolveQuestsPathBroker = ({
  guildId,
}: {
  guildId: Guild['id'];
}): QuestResolveQuestsPathResult => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const questsPath = join(
      homePath,
      dungeonmasterHomeStatics.paths.guildsDir,
      guildId,
      dungeonmasterHomeStatics.paths.questsDir,
    );

  return questResolveQuestsPathResultContract.parse({ questsPath });
};
