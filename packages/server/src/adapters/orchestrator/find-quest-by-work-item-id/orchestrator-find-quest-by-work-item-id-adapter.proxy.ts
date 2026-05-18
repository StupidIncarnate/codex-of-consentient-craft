import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorFindQuestByWorkItemIdAdapterProxy = (): {
  returns: (params: { questId: QuestId | null }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.findQuestByWorkItemId });
  mock.mockResolvedValue(null);

  return {
    returns: ({ questId }: { questId: QuestId | null }): void => {
      mock.mockResolvedValueOnce(questId);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
