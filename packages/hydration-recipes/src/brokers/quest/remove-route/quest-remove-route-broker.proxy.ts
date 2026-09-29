import { questDeleteBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/delete/quest-delete-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { questOwningGuildFindBrokerProxy } from '../owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

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
