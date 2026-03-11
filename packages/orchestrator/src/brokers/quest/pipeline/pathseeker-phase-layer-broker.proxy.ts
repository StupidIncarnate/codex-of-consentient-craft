import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';

export const pathseekerPhaseLayerBrokerProxy = (): {
  setupSpawnSuccess: () => void;
  setupSpawnFailure: () => void;
} => {
  const readlineProxy = readlineCreateInterfaceAdapterProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();

  return {
    setupSpawnSuccess: (): void => {
      const exitCode = ExitCodeStub({ value: 0 });
      spawnProxy.setupSuccess({ exitCode });
      // Queue a mockReturnValueOnce so this takes precedence over other proxies' mockImplementation
      spawnProxy.setupSpawn();
      setImmediate(() => {
        readlineProxy.emitLines({ lines: [] });
      });
    },
    setupSpawnFailure: (): void => {
      const exitCode = ExitCodeStub({ value: 1 });
      spawnProxy.setupSuccess({ exitCode });
      spawnProxy.setupSpawn();
      setImmediate(() => {
        readlineProxy.emitLines({ lines: [] });
      });
    },
  };
};
