import { clearTimeout } from './clear-timeout';
import { clearTimeoutProxy } from './clear-timeout.proxy';

describe('clearTimeout', () => {
  it('VALID: {pending timeout} => the callback never runs', async () => {
    const fired: string[] = [];
    const handle = globalThis.setTimeout(() => {
      fired.push('timer');
    }, 0);

    clearTimeout(handle);
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 10);
    });

    expect(fired).toStrictEqual([]);
  });

  it('EMPTY: {handle undefined} => forwards the undefined handle to the global without throwing', () => {
    const proxy = clearTimeoutProxy();

    clearTimeout(undefined);

    expect(proxy.getCallsFor({ handle: undefined })).toStrictEqual([[undefined]]);
  });

  it('VALID: {spy installed after import} => the call reaches the current global with the handle', () => {
    const proxy = clearTimeoutProxy();
    const handle = globalThis.setTimeout(() => undefined, 1000);

    clearTimeout(handle);

    expect(proxy.getCallsFor({ handle })).toStrictEqual([[handle]]);
  });
});
