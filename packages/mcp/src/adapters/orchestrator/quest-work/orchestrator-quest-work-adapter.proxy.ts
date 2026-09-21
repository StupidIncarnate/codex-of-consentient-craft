/**
 * PURPOSE: Proxy for orchestrator-quest-work-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorQuestWorkAdapterProxy();
 * proxy.returns({ questId: 'add-auth', workItemId: 'f47ac10b-…', result: { kind: 'outcome', word: 'done' } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type QuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.questWork>>;

export const orchestratorQuestWorkAdapterProxy = (): {
  returns: (params: { questId: string; workItemId: string; result: QuestWorkResult }) => void;
  throws: (params: { questId: string; workItemId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string; workItemId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.questWork });

  return {
    // questId + workItemId together are the discriminating address: several dispatched sessions
    // may call quest-work against the same quest at once, each with its own work item.
    returns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: string;
      workItemId: string;
      result: QuestWorkResult;
    }): void => {
      handle.calledWith([{ questId, workItemId }]).resolves(result);
    },
    throws: ({
      questId,
      workItemId,
      error,
    }: {
      questId: string;
      workItemId: string;
      error: Error;
    }): void => {
      handle.calledWith([{ questId, workItemId }]).rejects(error);
    },
    getLastCalledInputFor: ({
      questId,
      workItemId,
    }: {
      questId: string;
      workItemId: string;
    }): unknown => {
      const calls = handle.callsMatching([{ questId, workItemId }]);
      return calls.at(-1)?.[0];
    },
  };
};
