import { clearInterval } from './clear-interval';
import { clearIntervalProxy } from './clear-interval.proxy';

describe('clearInterval', () => {
  it('VALID: {running interval} => the callback stops after the first tick', async () => {
    const ticks: string[] = [];
    const handle = globalThis.setInterval(() => {
      ticks.push('tick');
    }, 1000);

    clearInterval(handle);
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 10);
    });

    expect(ticks).toStrictEqual([]);
  });

  it('EMPTY: {handle undefined} => forwards the undefined handle to the global without throwing', () => {
    const proxy = clearIntervalProxy();

    clearInterval(undefined);

    expect(proxy.getCallsFor({ handle: undefined })).toStrictEqual([[undefined]]);
  });

  it('VALID: {spy installed after import} => the call reaches the current global with the handle', () => {
    const proxy = clearIntervalProxy();
    const handle = globalThis.setInterval(() => undefined, 1000);

    clearInterval(handle);

    expect(proxy.getCallsFor({ handle })).toStrictEqual([[handle]]);
  });
});
