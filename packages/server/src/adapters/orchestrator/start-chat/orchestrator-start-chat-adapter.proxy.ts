import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

export const orchestratorStartChatAdapterProxy = (): {
  returns: (params: { chatProcessId: ProcessId; questId?: QuestId }) => void;
  throws: (params: { error: Error }) => void;
  getLastCalledArgs: () => unknown;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startChat });

  mock.mockResolvedValue({ chatProcessId: ProcessIdStub() });

  return {
    returns: ({
      chatProcessId,
      questId,
    }: {
      chatProcessId: ProcessId;
      questId?: QuestId;
    }): void => {
      mock.mockResolvedValueOnce({ chatProcessId, ...(questId === undefined ? {} : { questId }) });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
    getLastCalledArgs: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },
  };
};
