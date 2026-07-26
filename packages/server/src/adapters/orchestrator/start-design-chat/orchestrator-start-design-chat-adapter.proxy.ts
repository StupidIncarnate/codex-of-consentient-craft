import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartDesignChatAdapterProxy = (): {
  returns: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startDesignChat });

  return {
    returns: ({ questId, chatProcessId }: { questId: QuestId; chatProcessId: ProcessId }): void => {
      mock.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
