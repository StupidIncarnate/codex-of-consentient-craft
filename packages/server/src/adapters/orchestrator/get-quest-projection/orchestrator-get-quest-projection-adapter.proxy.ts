import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId, QuestProjectionStub } from '@dungeonmaster/shared/contracts';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

export const orchestratorGetQuestProjectionAdapterProxy = (): {
  returns: (params: { questId: QuestId; projection: QuestProjection }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getQuestProjection });

  return {
    returns: ({ questId, projection }: { questId: QuestId; projection: QuestProjection }): void => {
      mock.calledWith([{ questId }]).resolves(projection);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
