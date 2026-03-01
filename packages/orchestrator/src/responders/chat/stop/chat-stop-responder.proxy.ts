import { chatProcessStateProxy } from '../../../state/chat-process/chat-process-state.proxy';
import { ChatStopResponder } from './chat-stop-responder';

export const ChatStopResponderProxy = (): {
  callResponder: typeof ChatStopResponder;
  setupWithProcess: ReturnType<typeof chatProcessStateProxy>['setupWithProcess'];
  setupEmpty: ReturnType<typeof chatProcessStateProxy>['setupEmpty'];
} => {
  const stateProxy = chatProcessStateProxy();

  return {
    callResponder: ChatStopResponder,
    setupWithProcess: stateProxy.setupWithProcess,
    setupEmpty: stateProxy.setupEmpty,
  };
};
