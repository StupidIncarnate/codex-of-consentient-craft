import { ExecutionQueueBootstrapResponder } from './execution-queue-bootstrap-responder';
import { ExecutionQueueBootstrapResponderProxy } from './execution-queue-bootstrap-responder.proxy';

describe('ExecutionQueueBootstrapResponder', () => {
  it('VALID: {first call} => returns success', () => {
    ExecutionQueueBootstrapResponderProxy();

    const result = ExecutionQueueBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {second call} => idempotent, returns success again', () => {
    ExecutionQueueBootstrapResponderProxy();
    ExecutionQueueBootstrapResponder();

    const result = ExecutionQueueBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });
});
