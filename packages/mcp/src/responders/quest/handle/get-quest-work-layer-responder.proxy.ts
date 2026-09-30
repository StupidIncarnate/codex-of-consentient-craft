/**
 * PURPOSE: Proxy for get-quest-work-layer-responder. Composes orchestrator's own cross-package
 * proxy, and re-exposes its `getQuestWorkDefaultView()` — a responder's own test may not import
 * another package, so the only route to a real `QuestWorkView` runs through this shared proxy.
 *
 * USAGE:
 * const proxy = GetQuestWorkLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: { view: proxy.defaultView(), planText: null } });
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type GetQuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestWork>>;
type QuestWorkView = NonNullable<GetQuestWorkResult['view']>;
// Derived from the real StartOrchestrator.getQuestWork signature (never hand-typed) so the
// elements getQuestWorkGetCalls() hands back can be read by field without an ad-hoc cast.
type GetQuestWorkParams = Parameters<typeof StartOrchestrator.getQuestWork>[0];

export const GetQuestWorkLayerResponderProxy = (): {
  setupReturns: (params: { questId: Quest['id']; result: GetQuestWorkResult }) => void;
  setupThrows: (params: { questId: Quest['id']; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: Quest['id'] }) => unknown;
  defaultView: () => QuestWorkView;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    // `questId` alone is the address: the two call shapes differ by which SECOND id they carry, and
    // describing one of them here would leave the other unstaged and throwing.
    setupReturns: ({ questId, result }: { questId: Quest['id']; result: GetQuestWorkResult }): void => {
      orchestrator.getQuestWorkReturns({ questId, result });
    },
    setupThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.getQuestWorkThrows({ questId, error });
    },
    getLastCalledInputFor: ({ questId }: { questId: Quest['id'] }): unknown => {
      const calls = orchestrator.getQuestWorkGetCalls() as GetQuestWorkParams[];
      return calls.filter((call) => call.questId === questId).at(-1);
    },
    defaultView: (): QuestWorkView => orchestrator.getQuestWorkDefaultView(),
  };
};
