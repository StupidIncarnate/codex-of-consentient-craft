import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const operationOwningQuestFindBrokerProxy = (): {
  succeeds: ({ guild, quests }: { guild: GuildListItem; quests: readonly Quest[] }) => void;
} => {
  const listGuildsHandle = registerMock({ fn: StartOrchestrator.listGuilds });
  const listQuestsHandle = registerMock({ fn: StartOrchestrator.listQuests });
  const getQuestHandle = registerMock({ fn: StartOrchestrator.getQuest });

  return {
    succeeds: ({ guild, quests }: { guild: GuildListItem; quests: readonly Quest[] }): void => {
      listGuildsHandle.calledWith([]).resolves([guild]);
      listQuestsHandle.calledWith([{ guildId: guild.id }]).resolves(quests);
      quests.forEach((quest) => {
        getQuestHandle.calledWith([{ questId: quest.id }]).resolves({ success: true, quest });
      });
    },
  };
};
