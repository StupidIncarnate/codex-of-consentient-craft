import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';
import { QuestModifyResponder } from './quest-modify-responder';

export const QuestModifyResponderProxy = (): {
  setupModifyQuest: (params: { questId: string }) => { expectedData: { success: true } };
  setupModifyQuestError: (params: { questId: string; message: string }) => void;
  callResponder: typeof QuestModifyResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupModifyQuest: ({ questId }: { questId: string }): { expectedData: { success: true } } => {
      const result = { success: true as const };
      orchestrator.modifyQuestReturns({ questId, result: ModifyQuestResultStub(result) });
      return { expectedData: result };
    },
    setupModifyQuestError: ({ questId, message }: { questId: string; message: string }): void => {
      orchestrator.modifyQuestThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestModifyResponder,
  };
};
