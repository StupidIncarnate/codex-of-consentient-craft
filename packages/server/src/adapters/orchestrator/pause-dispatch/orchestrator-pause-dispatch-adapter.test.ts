import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestratorPauseDispatchAdapter } from './orchestrator-pause-dispatch-adapter';
import { orchestratorPauseDispatchAdapterProxy } from './orchestrator-pause-dispatch-adapter.proxy';

describe('orchestratorPauseDispatchAdapter', () => {
  it('VALID: {} => returns paused DispatchState', async () => {
    const proxy = orchestratorPauseDispatchAdapterProxy();
    proxy.returns({ state: DispatchStateStub() });

    const result = await orchestratorPauseDispatchAdapter();

    expect(result).toStrictEqual(DispatchStateStub());
  });

  it('ERROR: {orchestrator throws} => throws error', async () => {
    const proxy = orchestratorPauseDispatchAdapterProxy();
    proxy.throws({ error: new Error('pause failed') });

    await expect(orchestratorPauseDispatchAdapter()).rejects.toThrow(/^pause failed$/u);
  });
});
