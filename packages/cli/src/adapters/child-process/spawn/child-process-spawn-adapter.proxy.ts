import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { ExitCode } from '@dungeonmaster/shared/contracts';

jest.mock('child_process');

export const childProcessSpawnAdapterProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode }) => ChildProcess;
  setupSuccessWithNullExitCode: () => ChildProcess;
  setupError: (params: { error: Error }) => ChildProcess;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
} => {
  // Mock the npm package, not the adapter
  const mock = jest.mocked(spawn);

  // Helper to create mock child process with kill method
  const createMockChildProcess = (): ChildProcess => {
    const mockChildProcess = new EventEmitter() as ChildProcess;
    mockChildProcess.kill = jest.fn().mockReturnValue(true);
    return mockChildProcess;
  };

  // Default mock behavior - return mock child process
  mock.mockImplementation(() => createMockChildProcess());

  return {
    // Semantic method for setting successful spawn with exit code
    setupSuccess: ({ exitCode }: { exitCode: ExitCode }): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.mockReturnValueOnce(mockChildProcess);
      // Emit exit event asynchronously
      setImmediate(() => {
        mockChildProcess.emit('exit', exitCode);
      });
      return mockChildProcess;
    },

    // Semantic method for setting successful spawn with null exit code (process killed by signal)
    setupSuccessWithNullExitCode: (): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.mockReturnValueOnce(mockChildProcess);
      // Emit exit event with null exit code (process killed by signal)
      setImmediate(() => {
        mockChildProcess.emit('exit', null);
      });
      return mockChildProcess;
    },

    // Semantic method for setting spawn error
    setupError: ({ error }: { error: Error }): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.mockReturnValueOnce(mockChildProcess);
      // Emit error event asynchronously
      setImmediate(() => {
        mockChildProcess.emit('error', error);
      });
      return mockChildProcess;
    },

    // Get the command that was passed to spawn (returns unknown since from external mock)
    getSpawnedCommand: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },

    // Get the args that were passed to spawn (returns unknown since from external mock)
    getSpawnedArgs: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },
  };
};
