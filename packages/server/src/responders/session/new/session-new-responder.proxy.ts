import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { SessionNewResponder } from './session-new-responder';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const SessionNewResponderProxy = (): {
  setupSessionNew: (params: { chatProcessId: ProcessId }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof SessionNewResponder;
} => {
  const adapterProxy = orchestratorStartChatAdapterProxy();

  return {
    setupSessionNew: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      adapterProxy.returns({ chatProcessId });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: SessionNewResponder,
  };
};
