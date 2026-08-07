/**
 * PURPOSE: Proxy for quest-summary-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = QuestSummaryLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', summary: QuestSummaryStub() });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorGetQuestSummaryAdapterProxy } from '../../../adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter.proxy';

type GetQuestSummaryResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>;

export const QuestSummaryLayerResponderProxy = (): {
  setupReturns: (params: { questId: string; summary: GetQuestSummaryResult }) => void;
  setupThrows: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
} => {
  const adapterProxy = orchestratorGetQuestSummaryAdapterProxy();

  return {
    setupReturns: ({
      questId,
      summary,
    }: {
      questId: string;
      summary: GetQuestSummaryResult;
    }): void => {
      adapterProxy.returns({ questId, summary });
    },
    setupThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      adapterProxy.throws({ questId, error });
    },
    getLastCalledInputFor: ({ questId }: { questId: string }): unknown =>
      adapterProxy.getLastCalledInputFor({ questId }),
  };
};
