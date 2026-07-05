import { OrchestrationModeGetResponder } from './orchestration-mode-get-responder';
import { OrchestrationModeGetResponderProxy } from './orchestration-mode-get-responder.proxy';

describe('OrchestrationModeGetResponder', () => {
  it('VALID: {mode: "node"} => returns "node"', async () => {
    const proxy = OrchestrationModeGetResponderProxy();
    proxy.setupMode({ mode: 'node' });

    const result = await OrchestrationModeGetResponder();

    expect(result).toBe('node');
  });

  it('VALID: {mode: "claude"} => returns "claude"', async () => {
    const proxy = OrchestrationModeGetResponderProxy();
    proxy.setupMode({ mode: 'claude' });

    const result = await OrchestrationModeGetResponder();

    expect(result).toBe('claude');
  });
});
