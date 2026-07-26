import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; result: GetQuestResult }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getQuest });

  return {
    returns: ({ questId, result }: { questId: QuestId; result: GetQuestResult }): void => {
      mock.calledWith([{ questId }]).resolves(result);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
