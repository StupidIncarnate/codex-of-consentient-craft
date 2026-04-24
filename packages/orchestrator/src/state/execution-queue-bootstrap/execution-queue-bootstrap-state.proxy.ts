import { executionQueueBootstrapState } from './execution-queue-bootstrap-state';

export const executionQueueBootstrapStateProxy = (): {
  setupEmpty: () => void;
  setupRecoveredOnce: () => void;
} => ({
  setupEmpty: (): void => {
    executionQueueBootstrapState.clear();
  },
  setupRecoveredOnce: (): void => {
    executionQueueBootstrapState.clear();
    executionQueueBootstrapState.markRecovered();
  },
});
