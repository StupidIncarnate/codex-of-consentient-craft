import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type AdapterResult = ReturnType<typeof AdapterResultStub>;

// questId/workItemId are optional: a caller that only cares that the call resolves (it never
// reads the result, e.g. InteractionHandleResponderProxy's fire-and-forget signal-back path) and
// doesn't know the address ahead of time can omit them, which falls back to calledWith([]) — a
// real wildcard, not a hidden default, since it's staged explicitly by whichever proxy calls it.
export const orchestratorHandleSignalBackAdapterProxy = (): {
  resolves: (params: {
    questId?: QuestId;
    workItemId?: QuestWorkItemId;
    result: AdapterResult;
  }) => void;
  throws: (params: { questId?: QuestId; workItemId?: QuestWorkItemId; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.handleSignalBack });

  return {
    resolves: ({
      questId,
      workItemId,
      result,
    }: {
      questId?: QuestId;
      workItemId?: QuestWorkItemId;
      result: AdapterResult;
    }): void => {
      const address =
        questId === undefined || workItemId === undefined ? [] : [{ questId, workItemId }];
      handle.calledWith(address).resolves(result);
    },
    throws: ({
      questId,
      workItemId,
      error,
    }: {
      questId?: QuestId;
      workItemId?: QuestWorkItemId;
      error: Error;
    }): void => {
      const address =
        questId === undefined || workItemId === undefined ? [] : [{ questId, workItemId }];
      handle.calledWith(address).rejects(error);
    },
  };
};
