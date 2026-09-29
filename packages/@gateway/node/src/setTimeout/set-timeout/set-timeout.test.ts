import { setTimeout } from './set-timeout';
import { setTimeoutProxy } from './set-timeout.proxy';

describe('setTimeout', () => {
  it('VALID: {callback, delay 0, nothing staged} => a real timer runs the callback after the current turn', async () => {
    const order: string[] = [];

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        order.push('timer');
        resolve();
      }, 0);
      order.push('scheduled');
    });

    expect(order).toStrictEqual(['scheduled', 'timer']);
  });

  describe('setupFiresImmediately', () => {
    it('VALID: {staged for 3000} => runs the callback before setTimeout returns', () => {
      const proxy = setTimeoutProxy();
      proxy.setupFiresImmediately({ ms: 3000 });
      const order: string[] = [];

      setTimeout(() => {
        order.push('fired');
      }, 3000);
      order.push('returned');

      expect(order).toStrictEqual(['fired', 'returned']);
    });

    it('VALID: {staged for 3000, called with 1} => the other delay stays a real timer that fires later', async () => {
      const proxy = setTimeoutProxy();
      proxy.setupFiresImmediately({ ms: 3000 });
      const order: string[] = [];

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          order.push('fired');
          resolve();
        }, 1);
        order.push('scheduled');
      });

      expect(order).toStrictEqual(['scheduled', 'fired']);
    });
  });

  describe('setupNeverFires', () => {
    it('VALID: {staged for 5000} => the callback is held and a handle comes back', async () => {
      const proxy = setTimeoutProxy();
      proxy.setupNeverFires({ ms: 5000 });
      const order: string[] = [];

      const handle = setTimeout(() => {
        order.push('fired');
      }, 5000);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });

      expect({ order, hasRef: handle.hasRef() }).toStrictEqual({ order: [], hasRef: true });
    });
  });

  describe('getCallsFor', () => {
    it('VALID: {calls at 100, 900, 900} => reads back only the requested delay, in call order', () => {
      const proxy = setTimeoutProxy();
      proxy.setupNeverFires({ ms: 100 });
      proxy.setupNeverFires({ ms: 900 });
      const first = (): void => undefined;
      const second = (): void => undefined;

      setTimeout(first, 900);
      setTimeout(() => undefined, 100);
      setTimeout(second, 900);

      expect(proxy.getCallsFor({ ms: 900 })).toStrictEqual([
        [first, 900],
        [second, 900],
      ]);
    });

    it('EMPTY: {no call at the delay} => returns an empty list', () => {
      const proxy = setTimeoutProxy();

      expect(proxy.getCallsFor({ ms: 7000 })).toStrictEqual([]);
    });
  });
});
