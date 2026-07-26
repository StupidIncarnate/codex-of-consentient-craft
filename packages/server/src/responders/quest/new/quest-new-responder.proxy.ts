import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { QuestNewResponder } from './quest-new-responder';
import type { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const QuestNewResponderProxy = (): {
  setupQuestNew: (params: {
    guildId: GuildId;
    chatProcessId: ProcessId;
    questId?: QuestId;
  }) => void;
  setupError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof QuestNewResponder;
} => {
  const adapterProxy = orchestratorStartChatAdapterProxy();

  return {
    setupQuestNew: ({
      guildId,
      chatProcessId,
      questId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
      questId?: QuestId;
    }): void => {
      adapterProxy.returns({
        guildId,
        chatProcessId,
        ...(questId === undefined ? {} : { questId }),
      });
    },
    setupError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      adapterProxy.throws({ guildId, error: new Error(message) });
    },
    callResponder: QuestNewResponder,
  };
};
