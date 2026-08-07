/**
 * PURPOSE: Proxy for orchestrator-reset-flow-signoffs-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorResetFlowSignoffsAdapterProxy();
 * proxy.returns({ questId: 'add-auth', flowId: 'login-flow', result: { success: true, data: 'Siegemaster walk reset…' } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ResetFlowSignoffsResult = Awaited<ReturnType<typeof StartOrchestrator.resetFlowSignoffs>>;

export const orchestratorResetFlowSignoffsAdapterProxy = (): {
  returns: (params: { questId: string; flowId: string; result: ResetFlowSignoffsResult }) => void;
  throws: (params: { questId: string; flowId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string; flowId: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.resetFlowSignoffs });

  return {
    // questId + flowId together are the discriminating address: one session can reset several
    // flows on the same quest, so keying on questId alone would hand every call the same answer.
    returns: ({
      questId,
      flowId,
      result,
    }: {
      questId: string;
      flowId: string;
      result: ResetFlowSignoffsResult;
    }): void => {
      handle.calledWith([{ questId, flowId }]).resolves(result);
    },
    throws: ({
      questId,
      flowId,
      error,
    }: {
      questId: string;
      flowId: string;
      error: Error;
    }): void => {
      handle.calledWith([{ questId, flowId }]).rejects(error);
    },
    getLastCalledInputFor: ({ questId, flowId }: { questId: string; flowId: string }): unknown => {
      const calls = handle.callsMatching([{ questId, flowId }]);
      return calls.at(-1)?.[0];
    },
  };
};
