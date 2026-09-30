/**
 * PURPOSE: Proxy for quest-work-layer-responder. Composes orchestrator's own cross-package proxy,
 * and re-derives `getLastCalledInputFor` from `questWorkGetCalls()` — a responder's own test may not
 * import another package, so the only route to staging a real call runs through this shared proxy.
 *
 * USAGE:
 * const proxy = QuestWorkLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', workItemId: 'f47ac10b-…', result: { kind: 'outcome', word: 'done' } });
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type QuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.questWork>>;
// Derived from the real StartOrchestrator.questWork signature (never hand-typed) so the elements
// questWorkGetCalls() hands back can be read by field without an ad-hoc cast.
type QuestWorkParams = Parameters<typeof StartOrchestrator.questWork>[0];

export const QuestWorkLayerResponderProxy = (): {
  setupReturns: (params: {
    questId: Quest['id'];
    workItemId: WorkItem['id'];
    result: QuestWorkResult;
  }) => void;
  setupThrows: (params: { questId: Quest['id']; workItemId: WorkItem['id']; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: Quest['id']; workItemId: WorkItem['id'] }) => unknown;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupReturns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: Quest['id'];
      workItemId: WorkItem['id'];
      result: QuestWorkResult;
    }): void => {
      orchestrator.questWorkReturns({ questId, workItemId, result });
    },
    setupThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId: Quest['id'];
      workItemId: WorkItem['id'];
      error: Error;
    }): void => {
      orchestrator.questWorkThrows({ questId, workItemId, error });
    },
    getLastCalledInputFor: ({
      questId,
      workItemId,
    }: {
      questId: Quest['id'];
      workItemId: WorkItem['id'];
    }): unknown => {
      const calls = orchestrator.questWorkGetCalls() as QuestWorkParams[];
      return calls
        .filter((call) => call.questId === questId && call.workItemId === workItemId)
        .at(-1);
    },
  };
};
