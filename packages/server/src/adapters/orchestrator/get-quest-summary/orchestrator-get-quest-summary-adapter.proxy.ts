import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId, QuestSummaryStub } from '@dungeonmaster/shared/contracts';

type QuestSummary = ReturnType<typeof QuestSummaryStub>;

export const orchestratorGetQuestSummaryAdapterProxy = (): {
  returns: (params: { questId: QuestId; summary: QuestSummary }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getQuestSummary });

  return {
    returns: ({ questId, summary }: { questId: QuestId; summary: QuestSummary }): void => {
      mock.calledWith([{ questId }]).resolves(summary);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
