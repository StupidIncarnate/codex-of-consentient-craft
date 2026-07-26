import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorDeleteQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; deleted: boolean }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  getLastCalledArgs: (params: { questId: QuestId }) => unknown;
} => {
  const mock = registerMock({ fn: StartOrchestrator.deleteQuest });

  return {
    returns: ({ questId, deleted }: { questId: QuestId; deleted: boolean }): void => {
      mock.calledWith([{ questId }]).resolves({ deleted });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
    getLastCalledArgs: ({ questId }: { questId: QuestId }): unknown =>
      mock.callsMatching([{ questId }]).at(-1)?.[0],
  };
};
