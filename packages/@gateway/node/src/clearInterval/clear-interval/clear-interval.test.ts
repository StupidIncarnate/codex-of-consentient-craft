import { setInterval } from '../../setInterval/setInterval';
import { clearInterval } from './clear-interval';
import { clearIntervalProxy } from './clear-interval.proxy';
import { IntervalHandleStub } from '../interval-handle.stub';

describe('clearInterval', () => {
  it('VALID: {armed interval} => cancels it before it fires', async () => {
    let fireCount = 0;
    const handle = setInterval(() => {
      fireCount += 1;
    }, 10);

    clearInterval(handle);

    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, 25);
    });

    expect(fireCount).toBe(0);
  });

  it('VALID: {handle already cleared} => the second clear is a no-op', () => {
    const handle = IntervalHandleStub();

    clearInterval(handle);

    expect(handle.hasRef()).toBe(true);
  });

  describe('getCallsFor', () => {
    it('VALID: {two intervals, one cleared once and one twice} => reads back each handle by identity', () => {
      const proxy = clearIntervalProxy();
      const cleared = setInterval(() => undefined, 100);
      const kept = setInterval(() => undefined, 100);

      clearInterval(cleared);
      clearInterval(kept);
      clearInterval(kept);

      expect({
        cleared: proxy.getCallsFor({ handle: cleared }),
        kept: proxy.getCallsFor({ handle: kept }),
      }).toStrictEqual({ cleared: [[cleared]], kept: [[kept], [kept]] });
    });

    it('EMPTY: {no clear for the handle since the proxy was built} => returns an empty list', () => {
      const neverCleared = IntervalHandleStub();
      const proxy = clearIntervalProxy();

      expect(proxy.getCallsFor({ handle: neverCleared })).toStrictEqual([]);
    });
  });
});
