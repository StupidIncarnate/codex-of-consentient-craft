/**
 * PURPOSE: Proxy for get-quest-layer-responder. Composes orchestrator's own cross-package proxy.
 *
 * USAGE:
 * const proxy = GetQuestLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: GetQuestResultStub() });
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

export const GetQuestLayerResponderProxy = (): {
  setupReturns: (params: { questId: Quest['id']; result: GetQuestResult }) => void;
  setupThrows: (params: { questId: Quest['id']; error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    // getQuestReturns addresses on a branded QuestId — StartOrchestrator.getQuest itself takes a
    // plain string, but the shared proxy's own scenario type is branded, so a caller here that only
    // ever holds a raw string (this responder's own contract loosens it to `string`) re-brands
    // through the stub rather than an `as` cast.
    setupReturns: ({ questId, result }: { questId: Quest['id']; result: GetQuestResult }): void => {
      orchestrator.getQuestReturns({ questId: QuestIdStub({ value: questId }), result });
    },
    setupThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.getQuestThrows({ questId: QuestIdStub({ value: questId }), error });
    },
  };
};
