import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const orchestratorStartChatAdapterProxy = (): {
  returns: (params: { guildId: GuildId; chatProcessId: ProcessId; questId?: QuestId }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
  getLastCalledArgs: () => unknown;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startChat });

  return {
    returns: ({
      guildId,
      chatProcessId,
      questId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
      questId?: QuestId;
    }): void => {
      mock
        .calledWith([{ guildId }])
        .resolves({ chatProcessId, ...(questId === undefined ? {} : { questId }) });
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
    getLastCalledArgs: (): unknown => mock.callsMatching([]).at(-1)?.[0],
  };
};
