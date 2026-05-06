import { timerSetIntervalAdapter } from './timer-set-interval-adapter';
import { timerSetIntervalAdapterProxy } from './timer-set-interval-adapter.proxy';

describe('timerSetIntervalAdapter', () => {
  it('VALID: {callback, intervalMs} => registers callback and exposes stop handle', () => {
    const proxy = timerSetIntervalAdapterProxy();
    const callback = jest.fn();

    const handle = timerSetIntervalAdapter({ callback, intervalMs: 5000 });
    handle.stop();

    expect(proxy.getRegisteredCallback()).toBe(callback);
  });

  it('VALID: {triggerTick} => callback fires once on tick', () => {
    const proxy = timerSetIntervalAdapterProxy();
    const callback = jest.fn();

    timerSetIntervalAdapter({ callback, intervalMs: 5000 });
    proxy.triggerTick();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('VALID: {stop} => clears interval without throwing', () => {
    timerSetIntervalAdapterProxy();
    const callback = jest.fn();

    const handle = timerSetIntervalAdapter({ callback, intervalMs: 1000 });
    handle.stop();

    expect(callback).toHaveBeenCalledTimes(0);
  });
});
