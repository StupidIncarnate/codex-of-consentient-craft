import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questOwningGuildFindBrokerProxy = (): {
  succeeds: ({
    guilds,
    questsByGuildId,
  }: {
    guilds: readonly GuildListItem[];
    questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
  }) => void;
} => {
  const listGuildsHandle = registerMock({ fn: StartOrchestrator.listGuilds });
  const listQuestsHandle = registerMock({ fn: StartOrchestrator.listQuests });

  return {
    succeeds: ({
      guilds,
      questsByGuildId,
    }: {
      guilds: readonly GuildListItem[];
      questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
    }): void => {
      listGuildsHandle.calledWith([]).resolves(guilds);
      Object.entries(questsByGuildId).forEach(([guildId, quests]) => {
        listQuestsHandle.calledWith([{ guildId }]).resolves(quests);
      });
    },
  };
};
