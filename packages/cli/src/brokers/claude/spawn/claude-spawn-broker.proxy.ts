import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';

export const claudeSpawnBrokerProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
} => {
  const childProcessProxy = childProcessSpawnAdapterProxy();

  return {
    setupSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      // Mock successful spawn
      childProcessProxy.setupSuccess({ exitCode });
    },

    setupError: ({ error }: { error: Error }): void => {
      // Mock spawn error
      childProcessProxy.setupError({ error });
    },

    // Get the command that was passed to spawn
    getSpawnedCommand: (): unknown => childProcessProxy.getSpawnedCommand(),
  };
};
