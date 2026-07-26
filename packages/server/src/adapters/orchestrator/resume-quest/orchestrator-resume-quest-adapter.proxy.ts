import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorResumeQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; resumed: boolean; restoredStatus: QuestStatus }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.resumeQuest });

  return {
    returns: ({
      questId,
      resumed,
      restoredStatus,
    }: {
      questId: QuestId;
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      mock.calledWith([{ questId }]).resolves({ resumed, restoredStatus });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
