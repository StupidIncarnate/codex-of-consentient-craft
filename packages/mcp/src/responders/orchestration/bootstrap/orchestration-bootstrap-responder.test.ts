import { OrchestrationBootstrapResponderProxy } from './orchestration-bootstrap-responder.proxy';

describe('OrchestrationBootstrapResponder', () => {
  it('VALID: {} => returns the orchestrator bootstrap result', () => {
    const proxy = OrchestrationBootstrapResponderProxy();
    proxy.setupSuccess();

    const result = proxy.callResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('ERROR: {adapter throws} => propagates error', () => {
    const proxy = OrchestrationBootstrapResponderProxy();
    proxy.setupError({ message: 'bootstrap failed' });

    expect(() => proxy.callResponder()).toThrow(/^bootstrap failed$/u);
  });
});
