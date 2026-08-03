/**
 * PURPOSE: Proxy for orchestrator-get-blight-checklist-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorGetBlightChecklistAdapterProxy();
 * proxy.returns({ questId: 'add-auth', result: { success: true, data: '# BLIGHT CHECKLIST …' } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;

export const orchestratorGetBlightChecklistAdapterProxy = (): {
  returns: (params: { questId: string; result: GetBlightChecklistResult }) => void;
  throws: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getBlightChecklist });

  return {
    returns: ({ questId, result }: { questId: string; result: GetBlightChecklistResult }): void => {
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
