/**
 * PURPOSE: Mocks child_process.spawn for testing child process interactions, through
 * #gateway/npm/jest__globals's wrappers rather than the bare jest global.
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
import {
  doMock as gatewayDoMock,
  fn as gatewayFn,
  resetModules as gatewayResetModules,
} from '#gateway/npm/jest__globals';
import type { MockProcessBehavior } from '../../../contracts/mock-process-behavior/mock-process-behavior-contract';
import type { MockSpawnResult } from '../../../contracts/mock-spawn-result/mock-spawn-result-contract';

type MockChildProcessInstance = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: ReturnType<typeof gatewayFn>;
    end: ReturnType<typeof gatewayFn>;
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
    gatewayResetModules();

    // Mock child_process module
    const mockSpawn = gatewayFn();
    gatewayDoMock({
      moduleName: 'child_process',
      factory: () => ({
        spawn: mockSpawn,
      }),
    });

    mockSpawn.mockImplementation(() => {
      if (behavior.shouldThrow) {
        throw behavior.throwError || new Error('Mock spawn failure');
      }

      // Create mock child process using EventEmitter
      const mockProcess = new EventEmitter() as MockChildProcessInstance;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.stdin = {
        write: gatewayFn(),
        end: gatewayFn(),
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
        gatewayResetModules();
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
