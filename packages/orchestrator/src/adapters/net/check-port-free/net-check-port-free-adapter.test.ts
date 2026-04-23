import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { netCheckPortFreeAdapter } from './net-check-port-free-adapter';
import { netCheckPortFreeAdapterProxy } from './net-check-port-free-adapter.proxy';

const PORT = NetworkPortStub({ value: 4753 });

describe('netCheckPortFreeAdapter', () => {
  describe('port is free', () => {
    it('VALID: {bind succeeds then close} => resolves true', async () => {
      const proxy = netCheckPortFreeAdapterProxy();
      proxy.setupPortFree();

      const result = await netCheckPortFreeAdapter({ port: PORT });

      expect(result).toBe(true);
    });
  });

  describe('port is in use', () => {
    it('VALID: {bind emits error (EADDRINUSE)} => resolves false', async () => {
      const proxy = netCheckPortFreeAdapterProxy();
      proxy.setupPortInUse();

      const result = await netCheckPortFreeAdapter({ port: PORT });

      expect(result).toBe(false);
    });
  });
});
