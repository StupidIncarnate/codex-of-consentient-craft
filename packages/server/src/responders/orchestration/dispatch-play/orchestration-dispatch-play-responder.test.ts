import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchPlayResponderProxy } from './orchestration-dispatch-play-responder.proxy';

describe('OrchestrationDispatchPlayResponder', () => {
  it('VALID: {gate allows} => returns 200 with the play response', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    const state = DispatchStateStub({ mode: 'node-playing' });
    proxy.setupAllowed({ state });

    const result = await proxy.callResponder({ body: {} });

    expect(result).toStrictEqual({
      status: 200,
      data: { allowed: true, state },
    });
  });

  it('VALID: {force: true in body} => forwards force to the adapter', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupAllowed({ state: DispatchStateStub({ mode: 'node-playing' }) });

    await proxy.callResponder({ body: { force: true } });

    expect(proxy.getAdapterCalls()).toStrictEqual([{ force: true }]);
  });

  it('VALID: {null body} => treated as empty options and returns 200', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    const state = DispatchStateStub({ mode: 'node-playing' });
    proxy.setupAllowed({ state });

    const result = await proxy.callResponder({ body: null });

    expect(result).toStrictEqual({
      status: 200,
      data: { allowed: true, state },
    });
  });

  it('INVALID: {gate refuses} => returns 409 with the refusal response', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    const state = DispatchStateStub();
    proxy.setupRefused({ reason: 'A /dumpster-launch loop is active', state });

    const result = await proxy.callResponder({ body: {} });

    expect(result).toStrictEqual({
      status: 409,
      data: { allowed: false, reason: 'A /dumpster-launch loop is active', state },
    });
  });

  it('INVALID: {force: "yes"} => returns 400 without calling the adapter', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();

    const result = await proxy.callResponder({ body: { force: 'yes' } });

    expect(result.status).toBe(400);
    expect(proxy.getAdapterCalls()).toStrictEqual([]);
  });

  it('ERROR: {adapter throws} => returns 500 with error message', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupError({ message: 'play failed' });

    const result = await proxy.callResponder({ body: {} });

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'play failed' },
    });
  });
});
