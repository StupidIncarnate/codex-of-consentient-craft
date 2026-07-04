import { OrchestrationDispatchBootstrapResponder } from './orchestration-dispatch-bootstrap-responder';
import { OrchestrationDispatchBootstrapResponderProxy } from './orchestration-dispatch-bootstrap-responder.proxy';

describe('OrchestrationDispatchBootstrapResponder', () => {
  it('VALID: {first call} => returns success', () => {
    const proxy = OrchestrationDispatchBootstrapResponderProxy();
    proxy.reset();

    const result = OrchestrationDispatchBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {second call} => idempotent, returns success again', () => {
    const proxy = OrchestrationDispatchBootstrapResponderProxy();
    proxy.reset();
    OrchestrationDispatchBootstrapResponder();

    const result = OrchestrationDispatchBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });
});
