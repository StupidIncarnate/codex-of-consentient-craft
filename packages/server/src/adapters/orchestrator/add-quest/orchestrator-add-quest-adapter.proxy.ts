import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AddQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorAddQuestAdapterProxy = (): {
  returns: (params: { guildId: GuildId; result: AddQuestResult }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.addQuest });

  return {
    returns: ({ guildId, result }: { guildId: GuildId; result: AddQuestResult }): void => {
      mock.calledWith([{ guildId }]).resolves(result);
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
