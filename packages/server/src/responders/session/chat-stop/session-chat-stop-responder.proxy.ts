import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { chatProcessStateProxy } from '../../../state/chat-process/chat-process-state.proxy';
import { SessionChatStopResponder } from './session-chat-stop-responder';
import type { ProcessIdStub } from '../../../contracts/process-id/process-id.stub';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const SessionChatStopResponderProxy = (): {
  setupWithProcess: (params: { processId: ProcessId }) => void;
  setupEmpty: () => void;
  callResponder: typeof SessionChatStopResponder;
} => {
  processDevLogAdapterProxy();
  const stateProxy = chatProcessStateProxy();

  return {
    setupWithProcess: ({ processId }: { processId: ProcessId }): void => {
      stateProxy.setupWithProcess({ processId, kill: jest.fn() });
    },
    setupEmpty: (): void => {
      stateProxy.setupEmpty();
    },
    callResponder: SessionChatStopResponder,
  };
};
