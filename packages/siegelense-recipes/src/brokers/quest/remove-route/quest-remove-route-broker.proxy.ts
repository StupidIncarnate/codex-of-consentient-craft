import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questOwningGuildFindBrokerProxy } from '../owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questRemoveRouteBrokerProxy = (): {
  succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }) => void;
} => {
  const findGuildProxy = questOwningGuildFindBrokerProxy();
  const deleteQuestHandle = registerMock({ fn: StartOrchestrator.deleteQuest });

  return {
    succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }): void => {
      findGuildProxy.succeeds({
        guilds: [guild],
        questsByGuildId: { [guild.id]: [quest] },
      });
      deleteQuestHandle
        .calledWith([{ questId: quest.id, guildId: guild.id }])
        .resolves({ deleted: true });
    },
  };
};
