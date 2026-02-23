import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { QuestModifyResponder } from './quest-modify-responder';

export const QuestModifyResponderProxy = (): {
  setupModifyQuest: () => { expectedData: { success: true } };
  setupModifyQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestModifyResponder;
} => {
  const adapterProxy = orchestratorModifyQuestAdapterProxy();

  return {
    setupModifyQuest: (): { expectedData: { success: true } } => {
      const result = { success: true as const };
      adapterProxy.returns({ result: result as never });
      return { expectedData: result };
    },
    setupModifyQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestModifyResponder,
  };
};
