import { OrchestrationModeGetResponderProxy } from './orchestration-mode-get-responder.proxy';

describe('OrchestrationModeGetResponder', () => {
  it('VALID: {mode readable} => returns 200 with the mode', async () => {
    const proxy = OrchestrationModeGetResponderProxy();
    proxy.setupMode({ mode: 'node' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: { mode: 'node' },
    });
  });

  it('ERROR: {adapter throws} => returns 500 with error message', async () => {
    const proxy = OrchestrationModeGetResponderProxy();
    proxy.setupError({ message: 'read failed' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'read failed' },
    });
  });
});
