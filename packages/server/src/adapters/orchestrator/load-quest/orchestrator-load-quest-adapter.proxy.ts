import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const orchestratorLoadQuestAdapterProxy = (): {
  returns: (params: { quest: Quest }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.loadQuest });
  mock.mockResolvedValue(QuestStub());

  return {
    returns: ({ quest }: { quest: Quest }): void => {
      mock.mockResolvedValueOnce(quest);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
