/**
 * PURPOSE: Proxy for quest-summary-layer-responder. Composes orchestrator's own cross-package
 * proxy, and re-derives `getLastCalledInputFor` from `getQuestSummaryGetCalls()` — a responder's
 * own test may not import another package, so the only route to staging a real call runs through
 * this shared proxy.
 *
 * USAGE:
 * const proxy = QuestSummaryLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', summary: QuestSummaryStub() });
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type GetQuestSummaryResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>;
// Derived from the real StartOrchestrator.getQuestSummary signature (never hand-typed) so the
// elements getQuestSummaryGetCalls() hands back can be read by field without an ad-hoc cast.
type GetQuestSummaryParams = Parameters<typeof StartOrchestrator.getQuestSummary>[0];

export const QuestSummaryLayerResponderProxy = (): {
  setupReturns: (params: { questId: Quest['id']; summary: GetQuestSummaryResult }) => void;
  setupThrows: (params: { questId: Quest['id']; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: Quest['id'] }) => unknown;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupReturns: ({
      questId,
      summary,
    }: {
      questId: Quest['id'];
      summary: GetQuestSummaryResult;
    }): void => {
      orchestrator.getQuestSummaryReturns({ questId, summary });
    },
    setupThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.getQuestSummaryThrows({ questId, error });
    },
    getLastCalledInputFor: ({ questId }: { questId: Quest['id'] }): unknown => {
      const calls = orchestrator.getQuestSummaryGetCalls() as GetQuestSummaryParams[];
      return calls.filter((call) => call.questId === questId).at(-1);
    },
  };
};
