import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

export const ExecutionQueueGetAllResponderProxy = (): {
  setupEmpty: () => void;
} => {
  const stateProxy = questExecutionQueueStateProxy();
  return {
    setupEmpty: (): void => {
      stateProxy.setupEmpty();
    },
  };
};
