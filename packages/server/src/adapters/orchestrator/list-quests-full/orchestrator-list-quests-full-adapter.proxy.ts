import { questListBroker } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildId, QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const orchestratorListQuestsFullAdapterProxy = (): {
  returns: (params: { guildId: GuildId; quests: Quest[] }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: questListBroker });

  return {
    returns: ({ guildId, quests }: { guildId: GuildId; quests: Quest[] }): void => {
      mock.calledWith([{ guildId }]).resolves(quests);
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
