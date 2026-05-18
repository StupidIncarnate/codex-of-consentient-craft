import { timerSetTimeoutAdapter } from './timer-set-timeout-adapter';
import { timerSetTimeoutAdapterProxy } from './timer-set-timeout-adapter.proxy';

describe('timerSetTimeoutAdapter', () => {
  it('VALID: {ms: 200} => resolves with elapsedMs equal to requested delay', async () => {
    const proxy = timerSetTimeoutAdapterProxy();

    const result = await timerSetTimeoutAdapter({ ms: 200 });

    expect(result).toStrictEqual({ elapsedMs: 200 });
    expect(proxy.getRegisteredDelay()).toBe(200);
  });

  it('VALID: {ms: 0} => resolves immediately with elapsedMs: 0', async () => {
    const proxy = timerSetTimeoutAdapterProxy();

    const result = await timerSetTimeoutAdapter({ ms: 0 });

    expect(result).toStrictEqual({ elapsedMs: 0 });
    expect(proxy.getRegisteredDelay()).toBe(0);
  });
});
