/**
 * PURPOSE: Proxy for quest-work-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = QuestWorkLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', workItemId: 'f47ac10b-…', result: { kind: 'outcome', word: 'done' } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorQuestWorkAdapterProxy } from '../../../adapters/orchestrator/quest-work/orchestrator-quest-work-adapter.proxy';

type QuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.questWork>>;

export const QuestWorkLayerResponderProxy = (): {
  setupReturns: (params: { questId: string; workItemId: string; result: QuestWorkResult }) => void;
  setupThrows: (params: { questId: string; workItemId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string; workItemId: string }) => unknown;
} => {
  const adapterProxy = orchestratorQuestWorkAdapterProxy();

  return {
    setupReturns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: string;
      workItemId: string;
      result: QuestWorkResult;
    }): void => {
      adapterProxy.returns({ questId, workItemId, result });
    },
    setupThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId: string;
      workItemId: string;
      error: Error;
    }): void => {
      adapterProxy.throws({ questId, workItemId, error });
    },
    getLastCalledInputFor: ({
      questId,
      workItemId,
    }: {
      questId: string;
      workItemId: string;
    }): unknown => adapterProxy.getLastCalledInputFor({ questId, workItemId }),
  };
};
