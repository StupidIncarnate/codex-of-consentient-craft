import { ExecutionQueueBootstrapResponder } from './execution-queue-bootstrap-responder';
import { ExecutionQueueBootstrapResponderProxy } from './execution-queue-bootstrap-responder.proxy';

describe('ExecutionQueueBootstrapResponder', () => {
  it('VALID: {first call, then a queue mutation} => broadcasts execution-queue-updated', () => {
    const proxy = ExecutionQueueBootstrapResponderProxy();
    proxy.reset();
    const captured = proxy.captureBroadcasts();

    ExecutionQueueBootstrapResponder();
    proxy.triggerQueueChange();

    expect(captured).toStrictEqual([{ processId: 'execution-queue-runner', payload: {} }]);
  });

  // Deliberately does NOT call proxy.reset() here: state.installed inside the responder module has
  // no reset hook, so it stays true from the test above for the rest of this file — resetting the
  // queue's handler Set here would silently orphan that already-installed listener. A fresh
  // captureBroadcasts() still proves the SAME listener still answers exactly once.
  it('VALID: {second call} => idempotent, does not register a duplicate listener', () => {
    const proxy = ExecutionQueueBootstrapResponderProxy();
    const captured = proxy.captureBroadcasts();

    ExecutionQueueBootstrapResponder();
    proxy.triggerQueueChange();

    expect(captured).toStrictEqual([{ processId: 'execution-queue-runner', payload: {} }]);
  });
});
