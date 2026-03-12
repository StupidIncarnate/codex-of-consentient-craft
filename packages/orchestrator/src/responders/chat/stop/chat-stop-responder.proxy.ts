import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { ChatStopResponder } from './chat-stop-responder';

export const ChatStopResponderProxy = (): {
  callResponder: typeof ChatStopResponder;
  setupWithProcess: ReturnType<typeof orchestrationProcessesStateProxy>['setupWithProcessAndKill'];
  setupEmpty: ReturnType<typeof orchestrationProcessesStateProxy>['setupEmpty'];
} => {
  const stateProxy = orchestrationProcessesStateProxy();

  return {
    callResponder: ChatStopResponder,
    setupWithProcess: stateProxy.setupWithProcessAndKill,
    setupEmpty: stateProxy.setupEmpty,
  };
};
