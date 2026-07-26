import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const orchestratorLoadQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; quest: Quest }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.loadQuest });

  return {
    returns: ({ questId, quest }: { questId: QuestId; quest: Quest }): void => {
      mock.calledWith([{ questId }]).resolves(quest);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
