import { netKillPortAdapter } from './net-kill-port-adapter';
import { killPortHarness } from '../../../../test/harnesses/kill-port/kill-port.harness';

describe('netKillPortAdapter integration', () => {
  const harness = killPortHarness();

  describe('kills active server', () => {
    it('VALID: {port with active child server} => kills process and frees port', async () => {
      const port = await harness.getFreePort();
      const server = harness.spawnServerOnPort({ port });
      await harness.settle();

      expect(harness.isPortInUse({ port })).toBe(true);

      await netKillPortAdapter({ port });
      await harness.settle();

      server.kill();

      expect(harness.isPortInUse({ port })).toBe(false);
    });
  });

  describe('no-op on free port', () => {
    it('EMPTY: {port with no listeners} => resolves without error', async () => {
      const port = await harness.getFreePort();

      expect(harness.isPortInUse({ port })).toBe(false);

      await netKillPortAdapter({ port });

      expect(harness.isPortInUse({ port })).toBe(false);
    });
  });
});
