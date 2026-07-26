import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorAbandonQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; abandoned: boolean }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.abandonQuest });

  return {
    returns: ({ questId, abandoned }: { questId: QuestId; abandoned: boolean }): void => {
      mock.calledWith([{ questId }]).resolves({ abandoned });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
