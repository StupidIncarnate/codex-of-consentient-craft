/**
 * PURPOSE: Proxy for orchestrator-get-quest-planning-notes-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQuestPlanningNotesAdapterProxy();
 * proxy.returns({ questId: 'add-auth', result: { success: true, data: { blightLedger: [], questNotes: [], operationPlans: [] } } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;

export const orchestratorGetQuestPlanningNotesAdapterProxy = (): {
  returns: (params: { questId: string; result: GetPlanningNotesResult }) => void;
  throws: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getPlanningNotes });

  return {
    returns: ({ questId, result }: { questId: string; result: GetPlanningNotesResult }): void => {
      handle.calledWith([{ questId }]).resolves(result);
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
