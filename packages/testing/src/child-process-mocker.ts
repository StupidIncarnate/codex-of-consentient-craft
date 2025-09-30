import { EventEmitter } from 'events';

export interface MockSpawnResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface MockProcessBehavior {
  shouldThrow?: boolean;
  throwError?: Error;
  result?: MockSpawnResult;
  delay?: number;
}

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = {
    write: jest.fn(),
    end: jest.fn(),
  };

  constructor(private readonly behavior: MockProcessBehavior) {
    super();
  }

  async simulateProcess() {
    const { result = { code: 0, stdout: '', stderr: '' }, delay = 0 } = this.behavior;

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (result.stdout) {
      this.stdout.emit('data', result.stdout);
    }

    if (result.stderr) {
      this.stderr.emit('data', result.stderr);
    }

    this.emit('close', result.code);
  }
}

export const ChildProcessMocker = {
  mockSpawn: (behavior: MockProcessBehavior) => {
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

      const mockProcess = new MockChildProcess(behavior);

      // Start the simulation asynchronously
      process.nextTick(async () => mockProcess.simulateProcess());

      return mockProcess;
    });

    return {
      restore: () => {
        jest.resetModules();
      },
    };
  },

  // Preset behaviors for common scenarios
  presets: {
    success: (stdout = '', code = 0): MockProcessBehavior => ({
      result: { code, stdout, stderr: '' },
    }),

    failure: (stderr = 'Process failed', code = 1): MockProcessBehavior => ({
      result: { code, stdout: '', stderr },
    }),

    crash: (error = new Error('spawn ENOENT')): MockProcessBehavior => ({
      shouldThrow: true,
      throwError: error,
    }),

    eslintCrash: (): MockProcessBehavior => ({
      result: { code: 2, stdout: '', stderr: 'Oops! Something went wrong!' },
    }),

    timeout: (delay = 31000): MockProcessBehavior => ({
      delay,
      result: { code: 1, stdout: '', stderr: 'Timeout' },
    }),
  },
};
