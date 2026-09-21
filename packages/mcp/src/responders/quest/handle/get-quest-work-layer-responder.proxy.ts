/**
 * PURPOSE: Proxy for get-quest-work-layer-responder. Delegates to the orchestrator adapter proxy,
 * and re-exposes its `defaultView()` — a responder's own test may not import another package, so the
 * only route to a real `QuestWorkView` runs through the adapter proxy.
 *
 * USAGE:
 * const proxy = GetQuestWorkLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: { view: proxy.defaultView(), planText: null } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorGetQuestWorkAdapterProxy } from '../../../adapters/orchestrator/get-quest-work/orchestrator-get-quest-work-adapter.proxy';

type GetQuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestWork>>;
type QuestWorkView = NonNullable<GetQuestWorkResult['view']>;

export const GetQuestWorkLayerResponderProxy = (): {
  setupReturns: (params: { questId: string; result: GetQuestWorkResult }) => void;
  setupThrows: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
  defaultView: () => QuestWorkView;
} => {
  const adapterProxy = orchestratorGetQuestWorkAdapterProxy();

  return {
    setupReturns: ({ questId, result }: { questId: string; result: GetQuestWorkResult }): void => {
      adapterProxy.returns({ questId, result });
    },
    setupThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      adapterProxy.throws({ questId, error });
    },
    getLastCalledInputFor: ({ questId }: { questId: string }): unknown =>
      adapterProxy.getLastCalledInputFor({ questId }),
    defaultView: (): QuestWorkView => adapterProxy.defaultView(),
  };
};
