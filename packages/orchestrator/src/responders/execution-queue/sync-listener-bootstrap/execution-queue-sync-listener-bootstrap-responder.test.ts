import { ExecutionQueueSyncListenerBootstrapResponder } from './execution-queue-sync-listener-bootstrap-responder';
import { ExecutionQueueSyncListenerBootstrapResponderProxy } from './execution-queue-sync-listener-bootstrap-responder.proxy';

describe('ExecutionQueueSyncListenerBootstrapResponder', () => {
  it('VALID: {first call} => returns success', () => {
    ExecutionQueueSyncListenerBootstrapResponderProxy();

    const result = ExecutionQueueSyncListenerBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {second call} => idempotent, returns success again', () => {
    ExecutionQueueSyncListenerBootstrapResponderProxy();
    ExecutionQueueSyncListenerBootstrapResponder();

    const result = ExecutionQueueSyncListenerBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });
});
