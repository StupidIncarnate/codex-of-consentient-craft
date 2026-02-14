/**
 * PURPOSE: Resolves the quests directory path for a given guild ID within ~/.dungeonmaster/guilds/{guildId}/quests/
 *
 * USAGE:
 * const { questsPath } = await questResolveQuestsPathBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: { questsPath: AbsoluteFilePath } pointing to ~/.dungeonmaster/guilds/{guildId}/quests
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import type { AbsoluteFilePath, GuildId } from '@dungeonmaster/shared/contracts';

export const questResolveQuestsPathBroker = ({
  guildId,
}: {
  guildId: GuildId;
}): { questsPath: AbsoluteFilePath } => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const questsPath = pathJoinAdapter({
    paths: [
      homePath,
      dungeonmasterHomeStatics.paths.guildsDir,
      guildId,
      dungeonmasterHomeStatics.paths.questsDir,
    ],
  });

  return { questsPath: questsPath as AbsoluteFilePath };
};
