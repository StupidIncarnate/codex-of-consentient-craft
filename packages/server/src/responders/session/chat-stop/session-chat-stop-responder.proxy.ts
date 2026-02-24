import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { orchestratorStopChatAdapterProxy } from '../../../adapters/orchestrator/stop-chat/orchestrator-stop-chat-adapter.proxy';
import { SessionChatStopResponder } from './session-chat-stop-responder';

export const SessionChatStopResponderProxy = (): {
  setupWithProcess: () => void;
  setupEmpty: () => void;
  callResponder: typeof SessionChatStopResponder;
} => {
  processDevLogAdapterProxy();
  const stopProxy = orchestratorStopChatAdapterProxy();

  return {
    setupWithProcess: (): void => {
      stopProxy.returns({ stopped: true });
    },
    setupEmpty: (): void => {
      stopProxy.returns({ stopped: false });
    },
    callResponder: SessionChatStopResponder,
  };
};
