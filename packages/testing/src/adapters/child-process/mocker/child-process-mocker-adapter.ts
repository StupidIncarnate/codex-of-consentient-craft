/**
 * PURPOSE: Mocks child_process.spawn for testing child process interactions
 *
 * USAGE:
 * const mocker = childProcessMockerAdapter();
 * const mock = mocker.mockSpawn({ behavior: MockProcessBehaviorStub({ result: MockSpawnResultStub({ code: 0 }) }) });
 * // ... test code that spawns processes ...
 * mock.restore();
 *
 * CONTRACTS: Input: MockProcessBehavior (behavior configuration)
 * CONTRACTS: Output: { restore: () => void } (mock cleanup function)
 */

import { EventEmitter } from 'events';
import type { MockProcessBehavior } from '../../../contracts/mock-process-behavior/mock-process-behavior-contract';
import type { MockSpawnResult } from '../../../contracts/mock-spawn-result/mock-spawn-result-contract';

type MockChildProcessInstance = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: jest.Mock;
    end: jest.Mock;
  };
  behavior: MockProcessBehavior;
  simulateProcess: () => Promise<void>;
};

interface PresetSuccessParams {
  stdout?: MockSpawnResult['stdout'];
  code?: MockSpawnResult['code'];
}

interface PresetFailureParams {
  stderr?: MockSpawnResult['stderr'];
  code?: MockSpawnResult['code'];
}

interface PresetCrashParams {
  error?: Error;
}

interface PresetTimeoutParams {
  delay?: MockProcessBehavior['delay'];
}

export const childProcessMockerAdapter = (): {
  mockSpawn: ({ behavior }: { behavior: MockProcessBehavior }) => {
    restore: () => void;
  };
  presets: {
    success: (params: PresetSuccessParams) => MockProcessBehavior;
    failure: (params: PresetFailureParams) => MockProcessBehavior;
    crash: (params: PresetCrashParams) => MockProcessBehavior;
    eslintCrash: () => MockProcessBehavior;
    timeout: (params: PresetTimeoutParams) => MockProcessBehavior;
  };
} => ({
  mockSpawn: ({ behavior }: { behavior: MockProcessBehavior }) => {
    // Reset modules to ensure fresh imports
    jest.resetModules();

    // Mock child_process module
    const mockSpawn = jest.fn();
    jest.doMock('child_process', () => ({
      spawn: mockSpawn,
    }));

    mockSpawn.mockImplementation(() => {
      if (behavior.shouldThrow) {
        throw behavior.throwError || new Error('Mock spawn failure');
      }

      // Create mock child process using EventEmitter
      const mockProcess = new EventEmitter() as MockChildProcessInstance;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.stdin = {
        write: jest.fn(),
        end: jest.fn(),
      };
      mockProcess.behavior = behavior;
      mockProcess.simulateProcess = async (): Promise<void> => {
        const { result, delay } = behavior;

        if (delay && delay > 0) {
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
        }

        if (result) {
          if (result.stdout) {
            mockProcess.stdout.emit('data', result.stdout);
          }

          if (result.stderr) {
            mockProcess.stderr.emit('data', result.stderr);
          }

          mockProcess.emit('close', result.code);
        }
      };

      // Start the simulation asynchronously
      process.nextTick(async () => mockProcess.simulateProcess());

      return mockProcess;
    });

    return {
      restore: (): void => {
        jest.resetModules();
      },
    };
  },

  // Preset behaviors for common scenarios
  presets: {
    success: ({ stdout, code }: PresetSuccessParams = {}): MockProcessBehavior => ({
      result: {
        code: code ?? (0 as MockSpawnResult['code']),
        stdout: stdout ?? ('' as MockSpawnResult['stdout']),
        stderr: '' as MockSpawnResult['stderr'],
      },
    }),

    failure: ({ stderr, code }: PresetFailureParams = {}): MockProcessBehavior => ({
      result: {
        code: code ?? (1 as MockSpawnResult['code']),
        stdout: '' as MockSpawnResult['stdout'],
        stderr: stderr ?? ('Process failed' as MockSpawnResult['stderr']),
      },
    }),

    crash: ({ error }: PresetCrashParams = {}): MockProcessBehavior => ({
      shouldThrow: true,
      throwError: error ?? new Error('spawn ENOENT'),
    }),

    eslintCrash: (): MockProcessBehavior => ({
      result: {
        code: (0 as MockSpawnResult['code']) || (0 as MockSpawnResult['code']),
        stdout: '' as MockSpawnResult['stdout'],
        stderr: 'Oops! Something went wrong!' as MockSpawnResult['stderr'],
      },
    }),

    timeout: ({ delay }: PresetTimeoutParams = {}): MockProcessBehavior => ({
      delay: delay ?? ((0 as MockProcessBehavior['delay']) || (0 as MockProcessBehavior['delay'])),
      result: {
        code: 1 as MockSpawnResult['code'],
        stdout: '' as MockSpawnResult['stdout'],
        stderr: 'Timeout' as MockSpawnResult['stderr'],
      },
    }),
  },
});
