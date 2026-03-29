import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts';

type QuestId = ReturnType<typeof QuestIdStub>;

export const orchestratorRecoverActiveQuestsAdapterProxy = (): {
  returns: (params: { questIds: QuestId[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.recoverActiveQuests });

  mock.mockResolvedValue([]);

  return {
    returns: ({ questIds }: { questIds: QuestId[] }): void => {
      mock.mockResolvedValueOnce(questIds);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
