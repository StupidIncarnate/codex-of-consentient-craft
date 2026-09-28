import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { lineReaderProxy } from '#gateway/node/readline/line-reader/line-reader.proxy';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { RepoRootCwd } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { createInterface } from 'readline';
import { Readable } from 'stream';

import { agentSpawnStreamJsonBrokerProxy } from '../spawn-stream-json/agent-spawn-stream-json-broker.proxy';

type SpawnProxy = ReturnType<typeof agentSpawnStreamJsonBrokerProxy>;
type MockProcess = ReturnType<SpawnProxy['setupSpawn']>['mockProcess'];

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
  setupSuccessConfig: (params: Parameters<SpawnProxy['setupSuccess']>[0]) => void;
  setAutoEmitLines: (params: { lines: readonly string[] }) => void;
  emitLines: (params: { lines: readonly string[] }) => void;
  getSpawnedArgs: () => unknown;
  getAllSpawnedArgs: () => readonly unknown[];
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
} => {
  claudeLineNormalizeBrokerProxy();
  lineReaderProxy();
  stderrProxy();
  const spawnProxy = agentSpawnStreamJsonBrokerProxy();

  // `readline.createInterface` is one shared handle: the file tailer's proxy stages it for its own
  // fabricated stream. The child's stdout is a real `stream.Readable`, so `input instanceof
  // Readable` is a self-contained address, and the reader behind it is the real one — the lines a
  // test pushes onto stdout are what the broker reads.
  const realReadline = requireActual<{ createInterface: typeof createInterface }>({
    module: 'readline',
  });
  registerMock({ fn: createInterface })
    .calledWith([{ input: (input: unknown): boolean => input instanceof Readable }])
    .implement((options: never) => realReadline.createInterface(options));

  return {
    setupSpawnAndEmitLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: number | null;
    }): { mockProcess: MockProcess } => {
      const { mockProcess } = spawnProxy.setupSpawn();

      setImmediate(() => {
        spawnProxy.emitStdoutLines({ lines });
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
      const { mockProcess } = spawnProxy.setupSpawn();

      setImmediate(() => {
        spawnProxy.emitStdoutLines({ lines });
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
      spawnProxy.setupExitOnKill({
        exitCode: exitCode === null ? null : ExitCodeStub({ value: exitCode }),
      });
      const { mockProcess } = spawnProxy.setupSpawn();

      // Kill also emits the lines before the exit it schedules
      const exitOnKill = mockProcess.kill.getMockImplementation();
      mockProcess.kill.mockImplementation((...args: never[]) => {
        spawnProxy.emitStdoutLines({ lines });
        return exitOnKill?.(...args);
      });

      return { mockProcess };
    },

    setupSpawnOnceLazy: (): void => {
      spawnProxy.setupSpawnLazy();
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrow({ error });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrowOnce({ error });
    },

    setupSuccessConfig: ({ exitCode }: Parameters<SpawnProxy['setupSuccess']>[0]): void => {
      spawnProxy.setupSuccess({ exitCode });
    },

    setAutoEmitLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.setupAutoStdoutLines({ lines });
    },

    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.emitStdoutLines({ lines });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getAllSpawnedArgs: (): readonly unknown[] => spawnProxy.getAllSpawnedArgs(),

    getSpawnedOptions: (): unknown => spawnProxy.getSpawnedOptions(),

    getSpawnedCwd: (): RepoRootCwd | undefined => spawnProxy.getSpawnedCwd(),
  };
};
