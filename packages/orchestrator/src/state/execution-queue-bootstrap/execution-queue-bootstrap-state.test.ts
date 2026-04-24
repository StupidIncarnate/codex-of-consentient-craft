import { executionQueueBootstrapState } from './execution-queue-bootstrap-state';

describe('executionQueueBootstrapState', () => {
  it('EMPTY: {fresh module} => hasRecoveredOnce is false', () => {
    executionQueueBootstrapState.clear();

    expect(executionQueueBootstrapState.getHasRecoveredOnce()).toBe(false);
  });

  it('VALID: {markRecovered called} => hasRecoveredOnce is true', () => {
    executionQueueBootstrapState.clear();

    executionQueueBootstrapState.markRecovered();

    expect(executionQueueBootstrapState.getHasRecoveredOnce()).toBe(true);
  });

  it('VALID: {markRecovered then clear} => hasRecoveredOnce is false again', () => {
    executionQueueBootstrapState.clear();
    executionQueueBootstrapState.markRecovered();

    executionQueueBootstrapState.clear();

    expect(executionQueueBootstrapState.getHasRecoveredOnce()).toBe(false);
  });
});
