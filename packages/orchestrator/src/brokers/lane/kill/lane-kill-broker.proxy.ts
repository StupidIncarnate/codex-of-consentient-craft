import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { laneKillBroker } from './lane-kill-broker';

export const laneKillBrokerProxy = (): {
  callBroker: typeof laneKillBroker;
  setupStopped: (params: { stopped: boolean }) => void;
  setupImportFailure: (params: { error: Error }) => void;
  getKilledInstanceIds: () => readonly unknown[];
} => {
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses dynamicImport itself directly, keyed on the module specifier.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });
  // Reproduces the exact resolution the broker's own require.resolve() computes, in the same
  // process and directory — the real address, not a guess.
  const siegelenseBrokersPath = require.resolve('@dungeonmaster/siegelense/brokers');
  const instanceKillBroker = jest.fn().mockResolvedValue({ stopped: true });

  return {
    callBroker: laneKillBroker,

    setupStopped: ({ stopped }: { stopped: boolean }): void => {
      instanceKillBroker.mockResolvedValue({ stopped });
      importHandle.calledWith([{ path: siegelenseBrokersPath }]).resolves({ instanceKillBroker });
    },

    setupImportFailure: ({ error }: { error: Error }): void => {
      importHandle.calledWith([{ path: siegelenseBrokersPath }]).rejects(error);
    },

    getKilledInstanceIds: (): readonly unknown[] =>
      instanceKillBroker.mock.calls.map(
        (call: readonly [{ instanceId: unknown }]) => call[0].instanceId,
      ),
  };
};
