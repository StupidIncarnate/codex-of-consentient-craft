import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { netPortInUseAdapter } from './net-port-in-use-adapter';
import { netPortInUseAdapterProxy } from './net-port-in-use-adapter.proxy';

describe('netPortInUseAdapter', () => {
  describe('a port something holds', () => {
    it('VALID: {port: a listener answers with a pid} => returns true', async () => {
      const proxy = netPortInUseAdapterProxy();
      const port = NetworkPortStub({ value: 40000 });

      proxy.inUse({ port });

      await expect(netPortInUseAdapter({ port })).resolves.toBe(true);
    });
  });

  describe('a port nothing holds', () => {
    it('EMPTY: {port: no listener, empty stdout} => returns false', async () => {
      const proxy = netPortInUseAdapterProxy();
      const port = NetworkPortStub({ value: 40000 });

      proxy.free({ port });

      await expect(netPortInUseAdapter({ port })).resolves.toBe(false);
    });

    // lsof exits non-zero when it matches nothing. That is the ANSWER, not a failure, so the
    // adapter must read stdout rather than branching on the error argument.
    it('EDGE: {port: two ports staged differently} => answers each on its own probe', async () => {
      const proxy = netPortInUseAdapterProxy();
      const held = NetworkPortStub({ value: 40000 });
      const free = NetworkPortStub({ value: 51244 });

      proxy.inUse({ port: held });
      proxy.free({ port: free });

      expect({
        held: await netPortInUseAdapter({ port: held }),
        free: await netPortInUseAdapter({ port: free }),
      }).toStrictEqual({ held: true, free: false });
    });
  });
});
