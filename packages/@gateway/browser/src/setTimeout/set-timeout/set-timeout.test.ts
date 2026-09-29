import { TimeoutHandleStub } from '../timeout-handle.stub';
import { setTimeout } from './set-timeout';
import { setTimeoutProxy } from './set-timeout.proxy';

describe('setTimeout', () => {
  it('VALID: {callback, delay 0} => runs the callback after the current turn', async () => {
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

  it('VALID: {no delay} => still runs the callback', async () => {
    const fired = await new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('fired');
      });
    });

    expect(fired).toBe('fired');
  });

  it('VALID: {handle staged for delay 250} => returns the staged handle, so the global is read at call time', () => {
    const proxy = setTimeoutProxy();
    const stagedHandle = TimeoutHandleStub();
    proxy.stageHandle({ delay: 250, handle: stagedHandle });

    const returned = setTimeout(() => undefined, 250);

    expect(returned).toBe(stagedHandle);
  });

  describe('call inspection', () => {
    it('VALID: {two calls at different delays} => getCallsFor reads back only the requested delay', () => {
      const proxy = setTimeoutProxy();
      proxy.stageHandle({ delay: 100, handle: TimeoutHandleStub() });
      proxy.stageHandle({ delay: 900, handle: TimeoutHandleStub() });

      setTimeout(() => undefined, 900);
      setTimeout(() => undefined, 100);
      setTimeout(() => undefined, 900);

      expect(proxy.getCallsFor({ delay: 900 }).map((call) => call[1])).toStrictEqual([900, 900]);
    });
  });
});
