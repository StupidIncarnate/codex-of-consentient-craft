/**
 * PURPOSE: Proxy for orchestrator-get-quest-summary-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestSummaryAdapterProxy();
 * proxy.returns({ questId: 'add-auth', summary: QuestSummaryStub() });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GetQuestSummaryResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>;

export const orchestratorGetQuestSummaryAdapterProxy = (): {
  returns: (params: { questId: string; summary: GetQuestSummaryResult }) => void;
  throws: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getQuestSummary });

  return {
    returns: ({ questId, summary }: { questId: string; summary: GetQuestSummaryResult }): void => {
      handle.calledWith([{ questId }]).resolves(summary);
    },
    throws: ({ questId, error }: { questId: string; error: Error }): void => {
      handle.calledWith([{ questId }]).rejects(error);
    },
    getLastCalledInputFor: ({ questId }: { questId: string }): unknown => {
      const calls = handle.callsMatching([{ questId }]);
      return calls.at(-1)?.[0];
    },
  };
};
