import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type AdapterResult = ReturnType<typeof AdapterResultStub>;

export const orchestratorHandleSignalBackAdapterProxy = (): {
  resolves: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    result: AdapterResult;
  }) => void;
  throws: (params: { questId: QuestId; workItemId: QuestWorkItemId; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.handleSignalBack });

  return {
    resolves: ({
      questId,
      workItemId,
      result,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      result: AdapterResult;
    }): void => {
      handle.calledWith([{ questId, workItemId }]).resolves(result);
    },
    throws: ({
      questId,
      workItemId,
      error,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      error: Error;
    }): void => {
      handle.calledWith([{ questId, workItemId }]).rejects(error);
    },
  };
};
