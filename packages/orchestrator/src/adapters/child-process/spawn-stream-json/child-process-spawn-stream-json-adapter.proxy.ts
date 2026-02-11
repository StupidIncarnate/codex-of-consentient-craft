import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';

jest.mock('child_process');

interface ProxyConfig {
  exitCode: ExitCode | null;
  error: Error | null;
  stdoutData: readonly StreamJsonLine[];
  exitOnKill: boolean;
  exitCodeOnKill: ExitCode | null;
}

export const childProcessSpawnStreamJsonAdapterProxy = (): {
  setupSpawn: () => ChildProcess;
  setupSuccess: (params: { exitCode: ExitCode; stdoutData?: readonly StreamJsonLine[] }) => void;
  setupExitOnKill: (params: { exitCode: ExitCode | null }) => void;
  setupError: (params: { error: Error }) => void;
  setupSpawnThrow: (params: { error: Error }) => void;
  setupSpawnThrowOnce: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
} => {
  const mock = jest.mocked(spawn);
  const config: ProxyConfig = {
    exitCode: null,
    error: null,
    stdoutData: [],
    exitOnKill: false,
    exitCodeOnKill: null,
  };

  const createMockChildProcess = (): ChildProcess => {
    const mockChildProcess = new EventEmitter() as ChildProcess;
    mockChildProcess.stdout = Readable.from(config.stdoutData);
    mockChildProcess.stderr = null;
    mockChildProcess.stdin = null;

    if (config.exitOnKill) {
      // Exit only when kill() is called (for timeout testing)
      mockChildProcess.kill = jest.fn().mockImplementation(() => {
        setImmediate(() => {
          mockChildProcess.emit('exit', config.exitCodeOnKill);
        });
        return true;
      });
    } else {
      mockChildProcess.kill = jest.fn().mockReturnValue(true);
      // Schedule exit or error emission
      setImmediate(() => {
        if (config.error) {
          mockChildProcess.emit('error', config.error);
        } else if (config.exitCode !== null) {
          mockChildProcess.emit('exit', config.exitCode);
        }
      });
    }

    return mockChildProcess;
  };

  mock.mockImplementation(() => createMockChildProcess());

  return {
    setupSpawn: (): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.mockReturnValueOnce(mockChildProcess);
      return mockChildProcess;
    },

    setupSuccess: ({
      exitCode,
      stdoutData,
    }: {
      exitCode: ExitCode;
      stdoutData?: readonly StreamJsonLine[];
    }): void => {
      config.exitCode = exitCode;
      config.error = null;
      config.stdoutData = stdoutData ?? [];
      config.exitOnKill = false;
    },

    setupExitOnKill: ({ exitCode }: { exitCode: ExitCode | null }): void => {
      config.exitOnKill = true;
      config.exitCodeOnKill = exitCode;
      config.error = null;
      config.stdoutData = [];
    },

    setupError: ({ error }: { error: Error }): void => {
      config.error = error;
      config.exitCode = null;
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      mock.mockImplementation(() => {
        throw error;
      });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },

    getSpawnedCommand: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },

    getSpawnedArgs: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },
  };
};
