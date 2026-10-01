import { isPortFree } from './is-port-free';
import { isPortFreeProxy } from './is-port-free.proxy';

const isAbove4500 = (value: unknown): boolean => typeof value === 'number' && value > 4500;

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

  describe('getCalls / getCallsFor', () => {
    it('VALID: {probe port 4173} => getCallsFor returns [[4173]] and [] for unprobed port', async () => {
      const proxy = isPortFreeProxy();
      proxy.setupPortFree({ port: 4173 });

      await isPortFree({ port: 4173 });

      expect(proxy.getCallsFor({ port: 4173 })).toStrictEqual([[4173]]);
      expect(proxy.getCallsFor({ port: 8080 })).toStrictEqual([]);
      expect(proxy.getCalls()).toStrictEqual([[4173]]);
    });

    it('VALID: {multiple probes and predicate matcher} => getCallsFor matches predicate and getCalls returns all', async () => {
      const proxy = isPortFreeProxy();
      proxy.setupPortFree({ port: 4173 });
      proxy.setupPortInUse({ port: 5000 });

      await isPortFree({ port: 4173 });
      await isPortFree({ port: 5000 });

      expect(proxy.getCallsFor({ port: isAbove4500 })).toStrictEqual([[5000]]);
      expect(proxy.getCalls()).toStrictEqual([[4173], [5000]]);
    });

    it('EMPTY: {no calls made} => getCalls and getCallsFor return empty arrays', () => {
      const proxy = isPortFreeProxy();

      expect(proxy.getCalls()).toStrictEqual([]);
      expect(proxy.getCallsFor({ port: 4173 })).toStrictEqual([]);
    });
  });
});
