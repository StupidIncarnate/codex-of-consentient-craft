import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorResumeQuestAdapterProxy = (): {
  returns: (params: { resumed: boolean; restoredStatus: QuestStatus }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.resumeQuest });

  mock.mockResolvedValue({ resumed: true, restoredStatus: 'in_progress' as QuestStatus });

  return {
    returns: ({
      resumed,
      restoredStatus,
    }: {
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      mock.mockResolvedValueOnce({ resumed, restoredStatus });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
