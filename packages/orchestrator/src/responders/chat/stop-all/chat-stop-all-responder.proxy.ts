import { chatProcessStateProxy } from '../../../state/chat-process/chat-process-state.proxy';
import { ChatStopAllResponder } from './chat-stop-all-responder';

export const ChatStopAllResponderProxy = (): {
  callResponder: typeof ChatStopAllResponder;
  setupWithProcess: ReturnType<typeof chatProcessStateProxy>['setupWithProcess'];
  setupEmpty: ReturnType<typeof chatProcessStateProxy>['setupEmpty'];
} => {
  const stateProxy = chatProcessStateProxy();

  return {
    callResponder: ChatStopAllResponder,
    setupWithProcess: stateProxy.setupWithProcess,
    setupEmpty: stateProxy.setupEmpty,
  };
};
