import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

import { laneKillBroker } from './lane-kill-broker';

export const laneKillBrokerProxy = (): {
  callBroker: typeof laneKillBroker;
  setupStopped: (params: { stopped: boolean }) => void;
  setupImportFailure: (params: { error: Error }) => void;
  getKilledInstanceIds: () => readonly unknown[];
} => {
  const importProxy = runtimeDynamicImportAdapterProxy();
  // Reproduces the exact resolution the broker's own require.resolve() computes, in the same
  // process and directory — the real address, not a guess.
  const siegelenseBrokersPath = require.resolve('@dungeonmaster/siegelense/brokers');
  const instanceKillBroker = jest.fn().mockResolvedValue({ stopped: true });

  return {
    callBroker: laneKillBroker,

    setupStopped: ({ stopped }: { stopped: boolean }): void => {
      instanceKillBroker.mockResolvedValue({ stopped });
      importProxy.succeeds({ path: siegelenseBrokersPath, module: { instanceKillBroker } });
    },

    setupImportFailure: ({ error }: { error: Error }): void => {
      importProxy.throws({ path: siegelenseBrokersPath, error });
    },

    getKilledInstanceIds: (): readonly unknown[] =>
      instanceKillBroker.mock.calls.map(
        (call: readonly [{ instanceId: unknown }]) => call[0].instanceId,
      ),
  };
};
