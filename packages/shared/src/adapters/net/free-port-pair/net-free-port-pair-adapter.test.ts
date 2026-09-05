import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { netFreePortPairAdapter } from './net-free-port-pair-adapter';
import { netFreePortPairAdapterProxy } from './net-free-port-pair-adapter.proxy';

describe('netFreePortPairAdapter', () => {
  describe('successful port allocation', () => {
    it('VALID: {OS assigns two ports} => returns both NetworkPorts from the OS', async () => {
      const proxy = netFreePortPairAdapterProxy();
      proxy.setupPorts({ firstPort: 45_000, secondPort: 51_244 });

      const result = await netFreePortPairAdapter();

      expect(result).toStrictEqual({
        firstPort: NetworkPortStub({ value: 45_000 }),
        secondPort: NetworkPortStub({ value: 51_244 }),
      });
    });

    it('VALID: {OS assigns two far-apart ports} => returns both, never one derived from the other', async () => {
      // Staging 45_000 and 60_101 proves the second port comes from its own bound socket. A
      // caller deriving it arithmetically as `first + 1` would answer 45_001 here, and nothing
      // would have checked that 45_001 was free.
      const proxy = netFreePortPairAdapterProxy();
      proxy.setupPorts({ firstPort: 45_000, secondPort: 60_101 });

      const result = await netFreePortPairAdapter();

      expect(result).toStrictEqual({
        firstPort: NetworkPortStub({ value: 45_000 }),
        secondPort: NetworkPortStub({ value: 60_101 }),
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {bind fails} => throws error', async () => {
      const proxy = netFreePortPairAdapterProxy();
      proxy.setupError({ error: new Error('EADDRINUSE') });

      await expect(netFreePortPairAdapter()).rejects.toThrow(/Failed to bind port 0/u);
    });
  });
});
