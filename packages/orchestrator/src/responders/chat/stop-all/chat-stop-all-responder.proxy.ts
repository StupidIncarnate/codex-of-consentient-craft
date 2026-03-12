import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { ChatStopAllResponder } from './chat-stop-all-responder';

export const ChatStopAllResponderProxy = (): {
  callResponder: typeof ChatStopAllResponder;
  setupWithProcess: ReturnType<typeof orchestrationProcessesStateProxy>['setupWithProcessAndKill'];
  setupEmpty: ReturnType<typeof orchestrationProcessesStateProxy>['setupEmpty'];
} => {
  const stateProxy = orchestrationProcessesStateProxy();

  return {
    callResponder: ChatStopAllResponder,
    setupWithProcess: stateProxy.setupWithProcessAndKill,
    setupEmpty: stateProxy.setupEmpty,
  };
};
