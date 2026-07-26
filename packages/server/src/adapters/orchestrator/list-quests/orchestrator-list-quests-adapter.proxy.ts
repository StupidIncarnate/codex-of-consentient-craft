import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildId, QuestListItemStub } from '@dungeonmaster/shared/contracts';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const orchestratorListQuestsAdapterProxy = (): {
  returns: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.listQuests });

  return {
    returns: ({ guildId, quests }: { guildId: GuildId; quests: QuestListItem[] }): void => {
      mock.calledWith([{ guildId }]).resolves(quests);
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
