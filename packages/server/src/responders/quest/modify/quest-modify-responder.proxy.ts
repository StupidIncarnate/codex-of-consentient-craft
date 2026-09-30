import type { Quest } from '@dungeonmaster/shared/contracts';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';
import { QuestModifyResponder } from './quest-modify-responder';

export const QuestModifyResponderProxy = (): {
  setupModifyQuest: (params: { questId: Quest['id'] }) => { expectedData: { success: true } };
  setupModifyQuestError: (params: { questId: Quest['id']; message: string }) => void;
  callResponder: typeof QuestModifyResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupModifyQuest: ({ questId }: { questId: Quest['id'] }): { expectedData: { success: true } } => {
      const result = { success: true as const };
      orchestrator.modifyQuestReturns({ questId, result: ModifyQuestResultStub(result) });
      return { expectedData: result };
    },
    setupModifyQuestError: ({ questId, message }: { questId: Quest['id']; message: string }): void => {
      orchestrator.modifyQuestThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestModifyResponder,
  };
};
