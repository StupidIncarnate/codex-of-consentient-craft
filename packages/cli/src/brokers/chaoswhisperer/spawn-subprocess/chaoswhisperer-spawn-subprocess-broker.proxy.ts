import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';

export const chaoswhispererSpawnSubprocessBrokerProxy = (): {
  setupSuccess: () => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
} => {
  const childProcessProxy = childProcessSpawnAdapterProxy();

  return {
    setupSuccess: (): void => {
      // Mock successful spawn - use exit code 0 but we won't await it
      childProcessProxy.setupSuccess({ exitCode: 0 as never });
    },

    setupError: ({ error }: { error: Error }): void => {
      // Mock spawn error
      childProcessProxy.setupError({ error });
    },

    // Get the command that was passed to spawn
    getSpawnedCommand: (): unknown => childProcessProxy.getSpawnedCommand(),

    // Get the args that were passed to spawn
    getSpawnedArgs: (): unknown => childProcessProxy.getSpawnedArgs(),
  };
};
