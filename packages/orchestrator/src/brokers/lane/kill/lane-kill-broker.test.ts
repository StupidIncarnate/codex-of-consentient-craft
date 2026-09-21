import { SiegeInstanceIdStub } from '@dungeonmaster/shared/contracts';

import { laneKillBrokerProxy } from './lane-kill-broker.proxy';

describe('laneKillBroker', () => {
  describe('a live instance', () => {
    it('VALID: {stopped: true} => returns { stopped: true }', async () => {
      const proxy = laneKillBrokerProxy();
      proxy.setupStopped({ stopped: true });

      const result = await proxy.callBroker({ instanceId: SiegeInstanceIdStub() });

      expect(result).toStrictEqual({ stopped: true });
    });
  });

  describe('an already-dead instance', () => {
    it('VALID: {orphan reap, stopped: true} => returns { stopped: true } — safe to call twice', async () => {
      const proxy = laneKillBrokerProxy();
      proxy.setupStopped({ stopped: true });

      const first = await proxy.callBroker({ instanceId: SiegeInstanceIdStub() });
      const second = await proxy.callBroker({ instanceId: SiegeInstanceIdStub() });

      expect({ first, second }).toStrictEqual({
        first: { stopped: true },
        second: { stopped: true },
      });
    });
  });

  describe('module resolution failure', () => {
    it('ERROR: {module not found} => the error names the package rather than the specifier', async () => {
      const proxy = laneKillBrokerProxy();
      proxy.setupImportFailure({
        error: new Error("Cannot find module '/repo/packages/siegelense/dist/brokers.js'"),
      });

      await expect(proxy.callBroker({ instanceId: SiegeInstanceIdStub() })).rejects.toThrow(
        /^Failed to load @dungeonmaster\/siegelense\/brokers: Cannot find module '\/repo\/packages\/siegelense\/dist\/brokers\.js'$/u,
      );
    });
  });
});
