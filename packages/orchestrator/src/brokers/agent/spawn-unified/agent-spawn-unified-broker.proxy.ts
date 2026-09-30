import { setImmediate } from '#gateway/node/setImmediate';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { lineReaderProxy } from '#gateway/node/readline/line-reader/line-reader.proxy';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/brokers/claude-line/normalize/claude-line-normalize-broker.proxy';

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
  getSpawnedCwd: () => string | undefined;
} => {
  claudeLineNormalizeBrokerProxy();
  const lineReader = lineReaderProxy();
  stderrProxy();
  const spawnProxy = agentSpawnStreamJsonBrokerProxy();

  // The reader behind a spawned stdout or stderr is the real one — the lines a test pushes onto
  // stdout are what the broker reads. Staged by every method that arms a spawn.
  const stageSpawnedReaders = (): void => {
    lineReader.passesThroughFor({ input: spawnProxy.isSpawnedStdout });
    lineReader.passesThroughFor({ input: spawnProxy.isSpawnedStderr });
  };

  return {
    setupSpawnAndEmitLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: number | null;
    }): { mockProcess: MockProcess } => {
      stageSpawnedReaders();
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
      stageSpawnedReaders();
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
      stageSpawnedReaders();
      spawnProxy.setupExitOnKill({
        exitCode: exitCode === null ? null : exitCode,
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
      stageSpawnedReaders();
      spawnProxy.setupSpawnLazy();
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrow({ error });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrowOnce({ error });
    },

    setupSuccessConfig: ({ exitCode }: Parameters<SpawnProxy['setupSuccess']>[0]): void => {
      stageSpawnedReaders();
      spawnProxy.setupSuccess({ exitCode });
    },

    setAutoEmitLines: ({ lines }: { lines: readonly string[] }): void => {
      stageSpawnedReaders();
      spawnProxy.setupAutoStdoutLines({ lines });
    },

    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.emitStdoutLines({ lines });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getAllSpawnedArgs: (): readonly unknown[] => spawnProxy.getAllSpawnedArgs(),

    getSpawnedOptions: (): unknown => spawnProxy.getSpawnedOptions(),

    getSpawnedCwd: (): string | undefined => spawnProxy.getSpawnedCwd(),
  };
};
