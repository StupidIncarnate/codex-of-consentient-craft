/**
 * PURPOSE: Proxy for orchestrator-get-qa-checklist-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetQaChecklistAdapterProxy();
 * proxy.returns({ questId: 'add-auth', result: { success: true, data: '# QA CHECKLIST …' } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GetQaChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getQaChecklist>>;

export const orchestratorGetQaChecklistAdapterProxy = (): {
  returns: (params: { questId: string; result: GetQaChecklistResult }) => void;
  throws: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getQaChecklist });

  return {
    returns: ({ questId, result }: { questId: string; result: GetQaChecklistResult }): void => {
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
