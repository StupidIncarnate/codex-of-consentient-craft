import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { QuestModifyResponder } from './quest-modify-responder';

export const QuestModifyResponderProxy = (): {
  setupModifyQuest: (params: { questId: string }) => { expectedData: { success: true } };
  setupModifyQuestError: (params: { questId: string; message: string }) => void;
  callResponder: typeof QuestModifyResponder;
} => {
  const adapterProxy = orchestratorModifyQuestAdapterProxy();

  return {
    setupModifyQuest: ({ questId }: { questId: string }): { expectedData: { success: true } } => {
      const result = { success: true as const };
      adapterProxy.returns({ questId, result: result as never });
      return { expectedData: result };
    },
    setupModifyQuestError: ({ questId, message }: { questId: string; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },
    callResponder: QuestModifyResponder,
  };
};
