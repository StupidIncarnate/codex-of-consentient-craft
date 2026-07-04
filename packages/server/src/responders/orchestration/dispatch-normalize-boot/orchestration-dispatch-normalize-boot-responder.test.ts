import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchNormalizeBootResponderProxy } from './orchestration-dispatch-normalize-boot-responder.proxy';

describe('OrchestrationDispatchNormalizeBootResponder', () => {
  it('VALID: {} => returns the effective DispatchState from the adapter', async () => {
    const proxy = OrchestrationDispatchNormalizeBootResponderProxy();
    proxy.setupState({ state: DispatchStateStub() });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual(DispatchStateStub());
  });

  it('ERROR: {adapter throws} => propagates error', async () => {
    const proxy = OrchestrationDispatchNormalizeBootResponderProxy();
    proxy.setupError({ message: 'normalize failed' });

    await expect(proxy.callResponder()).rejects.toThrow(/^normalize failed$/u);
  });
});
