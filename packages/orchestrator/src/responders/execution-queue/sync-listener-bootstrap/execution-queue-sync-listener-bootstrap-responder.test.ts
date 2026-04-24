import { ExecutionQueueSyncListenerBootstrapResponder } from './execution-queue-sync-listener-bootstrap-responder';
import { ExecutionQueueSyncListenerBootstrapResponderProxy } from './execution-queue-sync-listener-bootstrap-responder.proxy';

describe('ExecutionQueueSyncListenerBootstrapResponder', () => {
  it('VALID: {first call} => returns success synchronously', () => {
    ExecutionQueueSyncListenerBootstrapResponderProxy();

    const result = ExecutionQueueSyncListenerBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {second call after first} => idempotent, returns success again', () => {
    ExecutionQueueSyncListenerBootstrapResponderProxy();
    ExecutionQueueSyncListenerBootstrapResponder();

    const result = ExecutionQueueSyncListenerBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });
});
