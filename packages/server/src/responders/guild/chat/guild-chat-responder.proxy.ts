import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { GuildChatResponder } from './guild-chat-responder';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const GuildChatResponderProxy = (): {
  setupGuildChat: (params: { chatProcessId: ProcessId }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof GuildChatResponder;
} => {
  const adapterProxy = orchestratorStartChatAdapterProxy();

  return {
    setupGuildChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      adapterProxy.returns({ chatProcessId });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildChatResponder,
  };
};
