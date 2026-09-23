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
  getCallArgs: (params: { questId: QuestId; workItemId: QuestWorkItemId }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.handleSignalBack });

  return {
    // Captures exactly what StartOrchestrator.handleSignalBack was called WITH, so a test can
    // assert the full object rather than only that a matching call happened — the only way to
    // catch a field (e.g. a re-added `operationStatus`) that the address match ignores, since
    // `callsMatching` addresses on the keys named and stays silent about every other key present.
    getCallArgs: ({
      questId,
      workItemId,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
    }): unknown => handle.callsMatching([{ questId, workItemId }]).at(-1)?.[0],
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
