import { OrchestrationBootstrapResponderProxy } from './orchestration-bootstrap-responder.proxy';

describe('OrchestrationBootstrapResponder', () => {
  it('VALID: {} => delegates once to the orchestrator bootstrap', () => {
    const proxy = OrchestrationBootstrapResponderProxy();
    proxy.setupSuccess();

    proxy.callResponder();

    expect(proxy.getBootstrapCalls()).toStrictEqual([[]]);
  });

  it('ERROR: {adapter throws} => propagates error', () => {
    const proxy = OrchestrationBootstrapResponderProxy();
    proxy.setupError({ message: 'bootstrap failed' });

    expect(() => {
      proxy.callResponder();
    }).toThrow(/^bootstrap failed$/u);
  });
});
