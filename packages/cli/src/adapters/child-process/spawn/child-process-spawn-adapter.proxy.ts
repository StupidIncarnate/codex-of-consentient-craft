import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { ExitCode } from '@dungeonmaster/shared/contracts';

jest.mock('child_process');

export const childProcessSpawnAdapterProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode }) => ChildProcess;
  setupError: (params: { error: Error }) => ChildProcess;
} => {
  // Mock the npm package, not the adapter
  const mock = jest.mocked(spawn);

  // Default mock behavior - return mock child process
  mock.mockImplementation(() => {
    const mockChildProcess = new EventEmitter() as ChildProcess;
    return mockChildProcess;
  });

  return {
    // Semantic method for setting successful spawn with exit code
    setupSuccess: ({ exitCode }: { exitCode: ExitCode }): ChildProcess => {
      const mockChildProcess = new EventEmitter() as ChildProcess;
      mock.mockReturnValueOnce(mockChildProcess);
      // Emit exit event asynchronously
      setImmediate(() => {
        mockChildProcess.emit('exit', exitCode);
      });
      return mockChildProcess;
    },

    // Semantic method for setting spawn error
    setupError: ({ error }: { error: Error }): ChildProcess => {
      const mockChildProcess = new EventEmitter() as ChildProcess;
      mock.mockReturnValueOnce(mockChildProcess);
      // Emit error event asynchronously
      setImmediate(() => {
        mockChildProcess.emit('error', error);
      });
      return mockChildProcess;
    },
  };
};
