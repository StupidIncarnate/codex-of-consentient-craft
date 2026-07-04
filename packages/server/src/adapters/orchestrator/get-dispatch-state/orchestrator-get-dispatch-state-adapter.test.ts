import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetDispatchStateAdapter } from './orchestrator-get-dispatch-state-adapter';
import { orchestratorGetDispatchStateAdapterProxy } from './orchestrator-get-dispatch-state-adapter.proxy';

describe('orchestratorGetDispatchStateAdapter', () => {
  it('VALID: {} => returns DispatchState', async () => {
    const proxy = orchestratorGetDispatchStateAdapterProxy();
    proxy.returns({ state: DispatchStateStub({ mode: 'node-playing' }) });

    const result = await orchestratorGetDispatchStateAdapter();

    expect(result).toStrictEqual(DispatchStateStub({ mode: 'node-playing' }));
  });

  it('ERROR: {orchestrator throws} => throws error', async () => {
    const proxy = orchestratorGetDispatchStateAdapterProxy();
    proxy.throws({ error: new Error('read failed') });

    await expect(orchestratorGetDispatchStateAdapter()).rejects.toThrow(/^read failed$/u);
  });
});
