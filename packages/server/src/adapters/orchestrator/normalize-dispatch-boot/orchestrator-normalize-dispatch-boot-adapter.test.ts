import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestratorNormalizeDispatchBootAdapter } from './orchestrator-normalize-dispatch-boot-adapter';
import { orchestratorNormalizeDispatchBootAdapterProxy } from './orchestrator-normalize-dispatch-boot-adapter.proxy';

describe('orchestratorNormalizeDispatchBootAdapter', () => {
  it('VALID: {} => returns the effective DispatchState', async () => {
    const proxy = orchestratorNormalizeDispatchBootAdapterProxy();
    proxy.returns({ state: DispatchStateStub() });

    const result = await orchestratorNormalizeDispatchBootAdapter();

    expect(result).toStrictEqual(DispatchStateStub());
  });

  it('ERROR: {orchestrator throws} => throws error', async () => {
    const proxy = orchestratorNormalizeDispatchBootAdapterProxy();
    proxy.throws({ error: new Error('normalize failed') });

    await expect(orchestratorNormalizeDispatchBootAdapter()).rejects.toThrow(/^normalize failed$/u);
  });
});
