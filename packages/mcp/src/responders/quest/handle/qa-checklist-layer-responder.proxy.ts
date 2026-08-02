/**
 * PURPOSE: Proxy for qa-checklist-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = QaChecklistLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: { success: true, data: '# QA CHECKLIST' } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorGetQaChecklistAdapterProxy } from '../../../adapters/orchestrator/get-qa-checklist/orchestrator-get-qa-checklist-adapter.proxy';

type GetQaChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getQaChecklist>>;

export const QaChecklistLayerResponderProxy = (): {
  setupReturns: (params: { questId: string; result: GetQaChecklistResult }) => void;
  setupThrows: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const adapterProxy = orchestratorGetQaChecklistAdapterProxy();

  return {
    setupReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetQaChecklistResult;
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
