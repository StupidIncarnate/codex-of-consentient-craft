import { setInterval } from './set-interval';
import { setIntervalProxy } from './set-interval.proxy';
import { IntervalHandleStub } from '../interval-handle.stub';

describe('setInterval', () => {
  it('VALID: {callback, period 1, nothing staged} => a real timer runs the callback after the current turn', async () => {
    const order: string[] = [];

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        globalThis.clearInterval(timer);
        order.push('tick');
        resolve();
      }, 1);
      order.push('scheduled');
    });

    expect(order).toStrictEqual(['scheduled', 'tick']);
  });

  it('VALID: {a spy installed on the global after import} => the call reaches the spy', () => {
    const proxy = setIntervalProxy();
    const stagedHandle = IntervalHandleStub();
    proxy.stageHandle({ ms: 5000, handle: stagedHandle });

    const result = setInterval(() => undefined, 5000);

    expect(result).toBe(stagedHandle);
  });

  describe('stageHandle', () => {
    it('VALID: {staged for 5000} => arms no real timer; the test fires the captured callback itself', () => {
      const proxy = setIntervalProxy();
      proxy.stageHandle({ ms: 5000, handle: IntervalHandleStub() });
      const ticks: string[] = [];

      setInterval(() => {
        ticks.push('tick');
      }, 5000);
      const [[callback]] = proxy.getCallsFor({ ms: 5000 }) as [[() => void]];

      expect(ticks).toStrictEqual([]);

      callback();
      callback();

      expect(ticks).toStrictEqual(['tick', 'tick']);
    });

    it('VALID: {staged for 5000, called with 1} => the other period stays a real timer that fires', async () => {
      const proxy = setIntervalProxy();
      proxy.stageHandle({ ms: 5000, handle: IntervalHandleStub() });
      const order: string[] = [];

      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          globalThis.clearInterval(timer);
          order.push('tick');
          resolve();
        }, 1);
        order.push('scheduled');
      });

      expect(order).toStrictEqual(['scheduled', 'tick']);
    });
  });

  describe('getCallsFor', () => {
    it('VALID: {calls at 100, 900, 900} => reads back only the requested period, in call order', () => {
      const proxy = setIntervalProxy();
      proxy.stageHandle({ ms: 100, handle: IntervalHandleStub() });
      proxy.stageHandle({ ms: 900, handle: IntervalHandleStub() });
      const first = (): void => undefined;
      const second = (): void => undefined;

      setInterval(first, 900);
      setInterval(() => undefined, 100);
      setInterval(second, 900);

      expect(proxy.getCallsFor({ ms: 900 })).toStrictEqual([
        [first, 900],
        [second, 900],
      ]);
    });

    it('EMPTY: {no call at the period} => returns an empty list', () => {
      const proxy = setIntervalProxy();

      expect(proxy.getCallsFor({ ms: 7000 })).toStrictEqual([]);
    });
  });
});
