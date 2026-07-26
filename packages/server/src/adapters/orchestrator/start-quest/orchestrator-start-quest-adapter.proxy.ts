import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorStartQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; processId: ProcessId }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startQuest });

  return {
    returns: ({ questId, processId }: { questId: QuestId; processId: ProcessId }): void => {
      mock.calledWith([{ questId }]).resolves(processId);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
