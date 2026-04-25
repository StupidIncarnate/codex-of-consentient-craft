import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';

type MockProcess = ReturnType<
  ReturnType<typeof childProcessSpawnStreamJsonAdapterProxy>['setupSpawn']
> & {
  kill: jest.Mock;
};

export const agentSpawnUnifiedBrokerProxy = (): {
  setupSpawnAndEmitLines: (params: { lines: readonly string[]; exitCode: number | null }) => {
    mockProcess: MockProcess;
  };
  setupSpawnAndEmitLinesWithError: (params: {
    lines: readonly string[];
    error: Error;
    exitCode: number | null;
  }) => { mockProcess: MockProcess };
  setupSpawnExitOnKill: (params: { lines: readonly string[]; exitCode: number | null }) => {
    mockProcess: MockProcess;
  };
  setupSpawnOnceLazy: () => void;
  setupSpawnThrow: (params: { error: Error }) => void;
  setupSpawnThrowOnce: (params: { error: Error }) => void;
  setupSuccessConfig: (
    params: Parameters<
      ReturnType<typeof childProcessSpawnStreamJsonAdapterProxy>['setupSuccess']
    >[0],
  ) => void;
  setAutoEmitLines: (params: { lines: readonly string[] }) => void;
  emitLines: (params: { lines: readonly string[] }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
} => {
  claudeLineNormalizeBrokerProxy();
  const readlineProxy = readlineCreateInterfaceAdapterProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();

  return {
    setupSpawnAndEmitLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: number | null;
    }): { mockProcess: MockProcess } => {
      const mockProcess = spawnProxy.setupSpawn() as MockProcess;

      setImmediate(() => {
        readlineProxy.emitLines({ lines });
        setImmediate(() => {
          mockProcess.emit('exit', exitCode);
        });
      });

      return { mockProcess };
    },

    setupSpawnAndEmitLinesWithError: ({
      lines,
      error,
      exitCode,
    }: {
      lines: readonly string[];
      error: Error;
      exitCode: number | null;
    }): { mockProcess: MockProcess } => {
      const mockProcess = spawnProxy.setupSpawn() as MockProcess;

      setImmediate(() => {
        readlineProxy.emitLines({ lines });
        mockProcess.emit('error', error);
        setImmediate(() => {
          mockProcess.emit('exit', exitCode);
        });
      });

      return { mockProcess };
    },

    setupSpawnExitOnKill: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: number | null;
    }): { mockProcess: MockProcess } => {
      spawnProxy.setupExitOnKill({ exitCode: exitCode as never });
      const mockProcess = spawnProxy.setupSpawn() as MockProcess;

      // Override kill to also emit lines before exit
      const originalKill = mockProcess.kill;
      mockProcess.kill = jest.fn().mockImplementation((...args: unknown[]) => {
        readlineProxy.emitLines({ lines });
        return originalKill(...args);
      });

      return { mockProcess };
    },

    setupSpawnOnceLazy: (): void => {
      spawnProxy.setupSpawnLazy();
      readlineProxy.skipAutoEmitOnce();
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrow({ error });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrowOnce({ error });
    },

    setupSuccessConfig: ({
      exitCode,
    }: Parameters<
      ReturnType<typeof childProcessSpawnStreamJsonAdapterProxy>['setupSuccess']
    >[0]): void => {
      spawnProxy.setupSuccess({ exitCode });
    },

    setAutoEmitLines: ({ lines }: { lines: readonly string[] }): void => {
      readlineProxy.setAutoEmitLines({ lines });
    },

    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      readlineProxy.emitLines({ lines });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getSpawnedOptions: (): unknown => spawnProxy.getSpawnedOptions(),
  };
};
