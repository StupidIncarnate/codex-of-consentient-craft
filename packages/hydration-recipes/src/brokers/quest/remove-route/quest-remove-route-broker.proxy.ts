import { questDeleteBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { questOwningGuildFindBrokerProxy } from '../owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questRemoveRouteBrokerProxy = (): {
  succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }) => void;
} => {
  const findGuildProxy = questOwningGuildFindBrokerProxy();
  const deleteProxy = questDeleteBrokerProxy();

  return {
    succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }): void => {
      findGuildProxy.succeeds({
        guilds: [guild],
        questsByGuildId: { [guild.id]: [quest] },
      });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      deleteProxy.setupQuestFolderPath({
        homePath,
        guildId: guild.id,
        questId: quest.id,
        questFolderPath: FilePathStub({
          value: `${homePath}/guilds/${guild.id}/quests/${quest.id}`,
        }),
      });
    },
  };
};
