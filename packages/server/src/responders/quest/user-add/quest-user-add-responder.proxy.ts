import { orchestratorAddQuestAdapterProxy } from '../../../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.proxy';
import { QuestUserAddResponder } from './quest-user-add-responder';

export const QuestUserAddResponderProxy = (): {
  setupAddQuest: () => { expectedData: unknown };
  setupAddQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestUserAddResponder;
} => {
  const adapterProxy = orchestratorAddQuestAdapterProxy();

  return {
    setupAddQuest: (): { expectedData: unknown } => {
      const result = {
        success: true as const,
        questId: 'test-quest',
        questFolder: '001-test-quest',
        filePath: '/path/to/quest.json',
      };
      adapterProxy.returns({ result: result as never });
      return { expectedData: result };
    },
    setupAddQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestUserAddResponder,
  };
};
