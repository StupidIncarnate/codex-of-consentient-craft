import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { QuestNewResponder } from './quest-new-responder';
import type { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

export const QuestNewResponderProxy = (): {
  setupQuestNew: (params: { chatProcessId: ProcessId; questId?: QuestId }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof QuestNewResponder;
} => {
  const adapterProxy = orchestratorStartChatAdapterProxy();

  return {
    setupQuestNew: ({
      chatProcessId,
      questId,
    }: {
      chatProcessId: ProcessId;
      questId?: QuestId;
    }): void => {
      adapterProxy.returns({ chatProcessId, ...(questId === undefined ? {} : { questId }) });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestNewResponder,
  };
};
