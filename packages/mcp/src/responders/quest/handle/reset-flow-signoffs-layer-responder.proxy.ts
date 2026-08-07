/**
 * PURPOSE: Proxy for reset-flow-signoffs-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = ResetFlowSignoffsLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', flowId: 'login-flow', result: { success: true, data: 'Siegemaster walk reset…' } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorResetFlowSignoffsAdapterProxy } from '../../../adapters/orchestrator/reset-flow-signoffs/orchestrator-reset-flow-signoffs-adapter.proxy';

type ResetFlowSignoffsResult = Awaited<ReturnType<typeof StartOrchestrator.resetFlowSignoffs>>;

export const ResetFlowSignoffsLayerResponderProxy = (): {
  setupReturns: (params: {
    questId: string;
    flowId: string;
    result: ResetFlowSignoffsResult;
  }) => void;
  setupThrows: (params: { questId: string; flowId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string; flowId: string }) => unknown;
} => {
  const adapterProxy = orchestratorResetFlowSignoffsAdapterProxy();

  return {
    setupReturns: ({
      questId,
      flowId,
      result,
    }: {
      questId: string;
      flowId: string;
      result: ResetFlowSignoffsResult;
    }): void => {
      adapterProxy.returns({ questId, flowId, result });
    },
    setupThrows: ({
      questId,
      flowId,
      error,
    }: {
      questId: string;
      flowId: string;
      error: Error;
    }): void => {
      adapterProxy.throws({ questId, flowId, error });
    },
    getLastCalledInputFor: ({ questId, flowId }: { questId: string; flowId: string }): unknown =>
      adapterProxy.getLastCalledInputFor({ questId, flowId }),
  };
};
