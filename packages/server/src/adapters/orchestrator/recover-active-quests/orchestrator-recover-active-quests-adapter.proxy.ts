import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts';

type QuestId = ReturnType<typeof QuestIdStub>;

export const orchestratorRecoverActiveQuestsAdapterProxy = (): {
  returns: (params: { questIds: QuestId[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.recoverActiveQuests });

  return {
    // recoverActiveQuests takes no argument — [] is the honest, non-catch-all address.
    returns: ({ questIds }: { questIds: QuestId[] }): void => {
      mock.calledWith([]).resolves(questIds);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
  };
};
