import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { SessionChatResponder } from './session-chat-responder';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const SessionChatResponderProxy = (): {
  setupSessionChat: (params: { chatProcessId: ProcessId }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof SessionChatResponder;
} => {
  const adapterProxy = orchestratorStartChatAdapterProxy();

  return {
    setupSessionChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      adapterProxy.returns({ chatProcessId });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: SessionChatResponder,
  };
};
