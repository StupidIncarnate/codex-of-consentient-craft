import { freePortPair } from './free-port-pair';

describe('freePortPair', () => {
  it('VALID: {no args} => resolves two positive OS-assigned ports', async () => {
    const { firstPort, secondPort } = await freePortPair();

    expect(firstPort).toBeGreaterThan(0);
    expect(secondPort).toBeGreaterThan(0);
  });

  it('VALID: {no args} => the two ports are distinct', async () => {
    const { firstPort, secondPort } = await freePortPair();

    expect(new Set([firstPort, secondPort]).size).toBe(2);
  });
});
