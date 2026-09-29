import { isPortFree } from './is-port-free';
import { isPortFreeProxy } from './is-port-free.proxy';

describe('isPortFree', () => {
  it('VALID: {port staged free} => resolves true', async () => {
    const proxy = isPortFreeProxy();
    proxy.setupPortFree({ port: 4173 });

    const result = await isPortFree({ port: 4173 });

    expect(result).toBe(true);
  });

  it('ERROR: {port staged in use} => resolves false on the bind error', async () => {
    const proxy = isPortFreeProxy();
    proxy.setupPortInUse({ port: 3737 });

    const result = await isPortFree({ port: 3737 });

    expect(result).toBe(false);
  });

  it('VALID: {two ports staged differently} => each port resolves its own staged result', async () => {
    const proxy = isPortFreeProxy();
    proxy.setupPortFree({ port: 4173 });
    proxy.setupPortInUse({ port: 3737 });

    const results = await Promise.all([isPortFree({ port: 4173 }), isPortFree({ port: 3737 })]);

    expect(results).toStrictEqual([true, false]);
  });

  it('VALID: {same port staged in use then free} => the latest staging wins', async () => {
    const proxy = isPortFreeProxy();
    proxy.setupPortInUse({ port: 3737 });
    proxy.setupPortFree({ port: 3737 });

    const result = await isPortFree({ port: 3737 });

    expect(result).toBe(true);
  });

  it('ERROR: {port never staged} => rejects naming the port', async () => {
    isPortFreeProxy();

    await expect(isPortFree({ port: 9999 })).rejects.toStrictEqual(
      new Error('isPortFreeProxy: port 9999 was not staged'),
    );
  });
});
