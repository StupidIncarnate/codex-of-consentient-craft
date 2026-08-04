/**
 * PURPOSE: Proxy for blight-checklist-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = BlightChecklistLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: { success: true, data: '# BLIGHT CHECKLIST' } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorGetBlightChecklistAdapterProxy } from '../../../adapters/orchestrator/get-blight-checklist/orchestrator-get-blight-checklist-adapter.proxy';

type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;

export const BlightChecklistLayerResponderProxy = (): {
  setupReturns: (params: { questId: string; result: GetBlightChecklistResult }) => void;
  setupThrows: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const adapterProxy = orchestratorGetBlightChecklistAdapterProxy();

  return {
    setupReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetBlightChecklistResult;
    }): void => {
      adapterProxy.returns({ questId, result });
    },
    setupThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      adapterProxy.throws({ questId, error });
    },
    getLastCalledInputFor: ({ questId }: { questId: string }): unknown =>
      adapterProxy.getLastCalledInputFor({ questId }),
  };
};
