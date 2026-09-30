/**
 * PURPOSE: Proxy for blight-checklist-layer-responder. Composes orchestrator's own cross-package
 * proxy, and re-derives `getLastCalledInputFor` from `getBlightChecklistGetCalls()` — a responder's
 * own test may not import another package, so the only route to staging a real call runs through
 * this shared proxy.
 *
 * USAGE:
 * const proxy = BlightChecklistLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: { success: true, data: '# BLIGHT CHECKLIST' } });
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;
// Derived from the real StartOrchestrator.getBlightChecklist signature (never hand-typed) so the
// elements getBlightChecklistGetCalls() hands back can be read by field without an ad-hoc cast.
type GetBlightChecklistParams = Parameters<typeof StartOrchestrator.getBlightChecklist>[0];

export const BlightChecklistLayerResponderProxy = (): {
  setupReturns: (params: { questId: Quest['id']; result: GetBlightChecklistResult }) => void;
  setupThrows: (params: { questId: Quest['id']; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: Quest['id'] }) => unknown;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupReturns: ({
      questId,
      result,
    }: {
      questId: Quest['id'];
      result: GetBlightChecklistResult;
    }): void => {
      orchestrator.getBlightChecklistReturns({ questId, result });
    },
    setupThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.getBlightChecklistThrows({ questId, error });
    },
    getLastCalledInputFor: ({ questId }: { questId: Quest['id'] }): unknown => {
      const calls = orchestrator.getBlightChecklistGetCalls() as GetBlightChecklistParams[];
      return calls.filter((call) => call.questId === questId).at(-1);
    },
  };
};
