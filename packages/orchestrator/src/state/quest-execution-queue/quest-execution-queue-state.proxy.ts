import { questExecutionQueueState } from './quest-execution-queue-state';

export const questExecutionQueueStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    questExecutionQueueState.clear();
  },
});
