import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorPlayDispatchAdapter } from './orchestrator-play-dispatch-adapter';
import { orchestratorPlayDispatchAdapterProxy } from './orchestrator-play-dispatch-adapter.proxy';

describe('orchestratorPlayDispatchAdapter', () => {
  it('VALID: {force: true} => forwards force and returns the response', async () => {
    const proxy = orchestratorPlayDispatchAdapterProxy();
    proxy.returns({ response: DispatchPlayResponseStub() });

    const result = await orchestratorPlayDispatchAdapter({ force: true });

    expect(result).toStrictEqual(DispatchPlayResponseStub());
    expect(proxy.getCalls()).toStrictEqual([{ force: true }]);
  });

  it('VALID: {no force} => forwards empty options', async () => {
    const proxy = orchestratorPlayDispatchAdapterProxy();
    proxy.returns({ response: DispatchPlayResponseStub() });

    await orchestratorPlayDispatchAdapter({});

    expect(proxy.getCalls()).toStrictEqual([{}]);
  });

  it('ERROR: {orchestrator throws} => throws error', async () => {
    const proxy = orchestratorPlayDispatchAdapterProxy();
    proxy.throws({ error: new Error('play failed') });

    await expect(orchestratorPlayDispatchAdapter({})).rejects.toThrow(/^play failed$/u);
  });
});
