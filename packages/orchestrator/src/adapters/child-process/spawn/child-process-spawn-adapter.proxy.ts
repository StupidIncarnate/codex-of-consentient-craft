import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const childProcessSpawnAdapterProxy = (): {
  setupSuccess: (params: { command: string; exitCode: ExitCode }) => ChildProcess;
  setupSuccessWithNullExitCode: (params: { command: string }) => ChildProcess;
  setupError: (params: { command: string; error: Error }) => ChildProcess;
  getArgsFor: (params: { command: string }) => unknown;
} => {
  // Mock the npm package, not the adapter
  const mock: MockHandle = registerMock({ fn: spawn });

  // Helper to create mock child process with kill method
  const createMockChildProcess = (): ChildProcess => {
    const mockChildProcess = new EventEmitter() as ChildProcess;
    mockChildProcess.kill = jest.fn().mockReturnValue(true);
    return mockChildProcess;
  };

  return {
    // Semantic method for setting successful spawn with exit code
    setupSuccess: ({
      command,
      exitCode,
    }: {
      command: string;
      exitCode: ExitCode;
    }): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.calledWith([command]).returns(mockChildProcess);
      // Emit exit event asynchronously
      setImmediate(() => {
        mockChildProcess.emit('exit', exitCode);
      });
      return mockChildProcess;
    },

    // Semantic method for setting successful spawn with null exit code (process killed by signal)
    setupSuccessWithNullExitCode: ({ command }: { command: string }): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.calledWith([command]).returns(mockChildProcess);
      // Emit exit event with null exit code (process killed by signal)
      setImmediate(() => {
        mockChildProcess.emit('exit', null);
      });
      return mockChildProcess;
    },

    // Semantic method for setting spawn error
    setupError: ({ command, error }: { command: string; error: Error }): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.calledWith([command]).returns(mockChildProcess);
      // Emit error event asynchronously
      setImmediate(() => {
        mockChildProcess.emit('error', error);
      });
      return mockChildProcess;
    },

    // Get the args spawn was called with for this command (returns unknown since from external mock)
    getArgsFor: ({ command }: { command: string }): unknown =>
      mock.callsMatching([command]).at(-1)?.[1],
  };
};
