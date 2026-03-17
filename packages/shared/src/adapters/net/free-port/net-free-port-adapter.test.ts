import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { netFreePortAdapter } from './net-free-port-adapter';
import { netFreePortAdapterProxy } from './net-free-port-adapter.proxy';

describe('netFreePortAdapter', () => {
  describe('successful port allocation', () => {
    it('VALID: {OS assigns port} => returns NetworkPort from OS', async () => {
      const proxy = netFreePortAdapterProxy();
      const expectedPort = 45_000;
      proxy.setupPort({ port: expectedPort });

      const result = await netFreePortAdapter();

      expect(result).toStrictEqual(NetworkPortStub({ value: expectedPort }));
    });
  });

  describe('error cases', () => {
    it('ERROR: {bind fails} => throws error', async () => {
      const proxy = netFreePortAdapterProxy();
      proxy.setupError({ error: new Error('EADDRINUSE') });

      await expect(netFreePortAdapter()).rejects.toThrow(/Failed to bind port 0/u);
    });
  });
});
