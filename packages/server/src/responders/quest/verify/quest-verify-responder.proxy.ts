import { orchestratorVerifyQuestAdapterProxy } from '../../../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter.proxy';
import { QuestVerifyResponder } from './quest-verify-responder';

export const QuestVerifyResponderProxy = (): {
  setupVerifyQuest: () => { expectedData: { success: true; checks: never[] } };
  setupVerifyQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestVerifyResponder;
} => {
  const adapterProxy = orchestratorVerifyQuestAdapterProxy();

  return {
    setupVerifyQuest: (): { expectedData: { success: true; checks: never[] } } => {
      const result = { success: true as const, checks: [] as never[] };
      adapterProxy.returns({ result: result as never });
      return { expectedData: result };
    },
    setupVerifyQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestVerifyResponder,
  };
};
