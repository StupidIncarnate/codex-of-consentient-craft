import { freePortPair } from './free-port-pair';
import { freePortPairProxy } from './free-port-pair.proxy';

describe('freePortPair', () => {
  it('VALID: {proxy stages fixed ports} => resolves exactly those two numbers', async () => {
    const proxy = freePortPairProxy();
    proxy.returns({ server: 40_000, web: 51_244 });

    const result = await freePortPair();

    expect(result).toStrictEqual({ firstPort: 40_000, secondPort: 51_244 });
  });

  it('VALID: {two separate freePortPair() calls, each staged} => each resolves its own staged pair', async () => {
    const firstProxy = freePortPairProxy();
    firstProxy.returns({ server: 40_000, web: 51_244 });
    const firstResult = await freePortPair();

    const secondProxy = freePortPairProxy();
    secondProxy.returns({ server: 45_000, web: 60_101 });
    const secondResult = await freePortPair();

    expect(firstResult).toStrictEqual({ firstPort: 40_000, secondPort: 51_244 });
    expect(secondResult).toStrictEqual({ firstPort: 45_000, secondPort: 60_101 });
  });

  it('VALID: {returnsSequence stages three pairs} => successive calls resolve them in order', async () => {
    const proxy = freePortPairProxy();
    proxy.returnsSequence({
      pairs: [
        { server: 40_001, web: 40_002 },
        { server: 40_003, web: 40_004 },
        { server: 40_005, web: 40_006 },
      ],
    });

    const first = await freePortPair();
    const second = await freePortPair();
    const third = await freePortPair();

    expect([first, second, third]).toStrictEqual([
      { firstPort: 40_001, secondPort: 40_002 },
      { firstPort: 40_003, secondPort: 40_004 },
      { firstPort: 40_005, secondPort: 40_006 },
    ]);
  });

  it('ERROR: {returnsSequence stages one pair, a second call is made} => the second call rejects with the unstaged-call message', async () => {
    const proxy = freePortPairProxy();
    proxy.returnsSequence({ pairs: [{ server: 40_001, web: 40_002 }] });

    await freePortPair();

    await expect(freePortPair()).rejects.toThrow(
      'registerMock: nothing set up for the call mockConstructor(). Calls that ARE set up: () | ()',
    );
  });

  it('VALID: {two freePortPair() calls} => getCalls reads back four zero-argument createServer calls', async () => {
    const proxy = freePortPairProxy();
    proxy.returnsSequence({
      pairs: [
        { server: 40_001, web: 40_002 },
        { server: 40_003, web: 40_004 },
      ],
    });

    await freePortPair();
    await freePortPair();

    expect(proxy.getCalls()).toStrictEqual([[], [], [], []]);
  });

  // These two exercised REAL loopback sockets before the proxy above existed (see is-port-free's
  // own `isPortFreeProxy` for why that was the original design). Once any test in this FILE mocks
  // `net.createServer` (the two above do), ts-jest's module mock swaps the WHOLE `net` module for
  // every test here — `jest.resetAllMocks()` between tests then wipes the real binding back to a
  // stub that returns `undefined`, so a call left unstaged in this file can no longer reach a real
  // socket. Staging keeps these assertions exactly what they always were: both ports positive, both
  // distinct.
  it('VALID: {no args} => resolves two positive OS-assigned ports', async () => {
    const proxy = freePortPairProxy();
    proxy.returns({ server: 40_000, web: 51_244 });

    const { firstPort, secondPort } = await freePortPair();

    expect(firstPort).toBeGreaterThan(0);
    expect(secondPort).toBeGreaterThan(0);
  });

  it('VALID: {no args} => the two ports are distinct', async () => {
    const proxy = freePortPairProxy();
    proxy.returns({ server: 40_000, web: 51_244 });

    const { firstPort, secondPort } = await freePortPair();

    expect(new Set([firstPort, secondPort]).size).toBe(2);
  });
});
