import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestratorPlayDispatchAdapter } from './orchestrator-play-dispatch-adapter';
import { orchestratorPlayDispatchAdapterProxy } from './orchestrator-play-dispatch-adapter.proxy';

describe('orchestratorPlayDispatchAdapter', () => {
  it('VALID: {} => returns the DispatchState', async () => {
    const proxy = orchestratorPlayDispatchAdapterProxy();
    proxy.returns({ state: DispatchStateStub() });

    const result = await orchestratorPlayDispatchAdapter();

    expect(result).toStrictEqual(DispatchStateStub());
  });

  it('VALID: {} => calls playDispatch with no arguments', async () => {
    const proxy = orchestratorPlayDispatchAdapterProxy();
    proxy.returns({ state: DispatchStateStub() });

    await orchestratorPlayDispatchAdapter();

    expect(proxy.getCalls()).toStrictEqual([[]]);
  });

  it('ERROR: {orchestrator throws} => throws error', async () => {
    const proxy = orchestratorPlayDispatchAdapterProxy();
    proxy.throws({ error: new Error('play failed') });

    await expect(orchestratorPlayDispatchAdapter()).rejects.toThrow(/^play failed$/u);
  });
});
