import { OrchestrationDispatchBootstrapResponder } from './orchestration-dispatch-bootstrap-responder';
import { OrchestrationDispatchBootstrapResponderProxy } from './orchestration-dispatch-bootstrap-responder.proxy';

describe('OrchestrationDispatchBootstrapResponder', () => {
  it('VALID: {first call, then a play/pause flip} => broadcasts dispatch-state-changed', () => {
    const proxy = OrchestrationDispatchBootstrapResponderProxy();
    proxy.reset();
    const captured = proxy.captureDispatchStateChangedEmits();

    OrchestrationDispatchBootstrapResponder();
    proxy.triggerPlayChange({ isPlaying: true });

    expect(captured).toStrictEqual([{ processId: 'node-dispatch-runner', payload: {} }]);
  });

  // Deliberately does NOT call proxy.reset() here: state.runner inside the responder module has no
  // reset hook, so it stays set from the test above for the rest of this file — resetting the
  // dispatch state's handler Set here would silently orphan that already-installed listener. A
  // fresh captureDispatchStateChangedEmits() still proves the SAME listener still answers once.
  it('VALID: {second call} => idempotent, does not register a duplicate listener', () => {
    const proxy = OrchestrationDispatchBootstrapResponderProxy();
    const captured = proxy.captureDispatchStateChangedEmits();

    OrchestrationDispatchBootstrapResponder();
    proxy.triggerPlayChange({ isPlaying: false });

    expect(captured).toStrictEqual([{ processId: 'node-dispatch-runner', payload: {} }]);
  });
});
