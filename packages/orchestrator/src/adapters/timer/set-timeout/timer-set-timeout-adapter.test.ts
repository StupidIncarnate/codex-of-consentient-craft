import { timerSetTimeoutAdapter } from './timer-set-timeout-adapter';
import { timerSetTimeoutAdapterProxy } from './timer-set-timeout-adapter.proxy';

describe('timerSetTimeoutAdapter', () => {
  it('VALID: {ms: 200} => resolves, registering the requested delay', async () => {
    const proxy = timerSetTimeoutAdapterProxy();

    await timerSetTimeoutAdapter({ ms: 200 });

    expect(proxy.getRegisteredDelay()).toBe(200);
  });

  it('VALID: {ms: 0} => resolves immediately, registering a zero delay', async () => {
    const proxy = timerSetTimeoutAdapterProxy();

    await timerSetTimeoutAdapter({ ms: 0 });

    expect(proxy.getRegisteredDelay()).toBe(0);
  });
});
