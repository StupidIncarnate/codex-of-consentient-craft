import { IntervalHandleStub } from '../interval-handle.stub';
import { setInterval } from './set-interval';
import { setIntervalProxy } from './set-interval.proxy';

describe('setInterval', () => {
  it('VALID: {callback, delay 1} => runs the callback repeatedly until cleared', async () => {
    const seen = await new Promise<string[]>((resolve) => {
      const ticks: string[] = [];
      const handle = setInterval(() => {
        ticks.push('tick');
        globalThis.clearInterval(handle);
        resolve(ticks);
      }, 1);
    });

    expect(seen).toStrictEqual(['tick']);
  });

  it('VALID: {handle staged for delay 1000} => returns the staged handle, so the global is read at call time', () => {
    const proxy = setIntervalProxy();
    const stagedHandle = IntervalHandleStub();
    proxy.stageHandle({ delay: 1000, handle: stagedHandle });

    const returned = setInterval(() => undefined, 1000);

    expect(returned).toBe(stagedHandle);
  });

  describe('call inspection', () => {
    it('VALID: {two calls at different delays} => getCallsFor reads back only the requested delay', () => {
      const proxy = setIntervalProxy();
      proxy.stageHandle({ delay: 100, handle: IntervalHandleStub() });
      proxy.stageHandle({ delay: 900, handle: IntervalHandleStub() });

      setInterval(() => undefined, 900);
      setInterval(() => undefined, 100);

      expect(proxy.getCallsFor({ delay: 900 }).map((call) => call[1])).toStrictEqual([900]);
    });
  });
});
