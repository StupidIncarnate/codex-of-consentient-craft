/**
 * PURPOSE: Replaces child_process.spawn, for a test that loads its subject fresh after this runs, with a
 * fake process that emits a staged stdout, stderr and exit code. Reach for registerMock over this
 * when the subject imports child_process statically: this swaps the whole module through
 * doMock + resetModules, so it only reaches modules required after the call.
 *
 * USAGE:
 * const mocker = childProcessMockMiddleware();
 * const mock = mocker.mockSpawn({ behavior: MockProcessBehaviorStub({ result: MockSpawnResultStub({ code: 0 }) }) });
 * // ... test code that spawns processes ...
 * mock.restore();
 *
 * CONTRACTS: Input: MockProcessBehavior (behavior configuration)
 * CONTRACTS: Output: { restore: () => void } (mock cleanup function)
 */

import { EventEmitter } from '#gateway/node/events';
import { nextTick } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';
import {
  doMock as gatewayDoMock,
  fn as gatewayFn,
  resetModules as gatewayResetModules,
} from '#gateway/npm/jest__globals';
import type { MockProcessBehavior } from '../../contracts/mock-process-behavior/mock-process-behavior-contract';
import { mockProcessBehaviorContract } from '../../contracts/mock-process-behavior/mock-process-behavior-contract';

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

export const childProcessMockMiddleware = (): {
  mockSpawn: ({ behavior }: { behavior: MockProcessBehavior }) => {
    restore: () => void;
  };
  presets: {
    success: (params: { stdout?: string; code?: number }) => MockProcessBehavior;
    failure: (params: { stderr?: string; code?: number }) => MockProcessBehavior;
    crash: (params: { error?: Error }) => MockProcessBehavior;
    eslintCrash: () => MockProcessBehavior;
    timeout: (params: { delay?: number | undefined }) => MockProcessBehavior;
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
      nextTick(() => {
        mockProcess.simulateProcess().catch((error: unknown) => {
          throw error;
        });
      });

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
    success: ({
      stdout,
      code,
    }: {
      stdout?: string;
      code?: number;
    } = {}): MockProcessBehavior =>
      mockProcessBehaviorContract.parse({
        result: {
          code: code ?? 0,
          stdout: stdout ?? '',
          stderr: '',
        },
      }),

    failure: ({
      stderr,
      code,
    }: {
      stderr?: string;
      code?: number;
    } = {}): MockProcessBehavior =>
      mockProcessBehaviorContract.parse({
        result: {
          code: code ?? 1,
          stdout: '',
          stderr: stderr ?? 'Process failed',
        },
      }),

    crash: ({ error }: { error?: Error } = {}): MockProcessBehavior =>
      mockProcessBehaviorContract.parse({
        shouldThrow: true,
        throwError: error ?? new Error('spawn ENOENT'),
      }),

    eslintCrash: (): MockProcessBehavior =>
      mockProcessBehaviorContract.parse({
        result: {
          code: 0,
          stdout: '',
          stderr: 'Oops! Something went wrong!',
        },
      }),

    timeout: ({ delay }: { delay?: number | undefined } = {}): MockProcessBehavior =>
      mockProcessBehaviorContract.parse({
        delay: delay ?? 0,
        result: {
          code: 1,
          stdout: '',
          stderr: 'Timeout',
        },
      }),
  },
});
