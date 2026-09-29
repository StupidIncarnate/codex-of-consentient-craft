import { ChildProcessStub } from '#gateway/node/child_process/child-process/child-process.stub';
import { spawnLiveProxy } from '#gateway/node/child_process/spawn-live/spawn-live.proxy';
import { queueMicrotask } from '#gateway/node/queueMicrotask';
import { setImmediate } from '#gateway/node/setImmediate';

import { resolveClaudeCliPathProxy } from '../resolve-claude-cli-path/resolve-claude-cli-path.proxy';

type MockProcess = ReturnType<typeof ChildProcessStub> & { kill: jest.Mock };

const DEFAULT_CLI_PATH = '/fake/bin/claude';

export const spawnStreamJsonProxy = (): {
  setupSuccess: (params: { cliPath: string }) => MockProcess;
  setupCliPath: (params: { cliPath: string }) => void;
  setupCliNotInstalled: () => void;
  setupSpawn: () => { mockProcess: MockProcess };
  setupSpawnLazy: () => void;
  setupExitCode: (params: { exitCode: number }) => void;
  setupExitOnKill: (params: { exitCode: number | null }) => void;
  setupError: (params: { error: Error }) => void;
  setupSpawnThrow: (params: { error: Error }) => void;
  setupSpawnThrowOnce: (params: { error: Error }) => void;
  setupAutoStdoutLines: (params: { lines: readonly string[] }) => void;
  emitStdoutLines: (params: { lines: readonly string[] }) => void;
  isSpawnedStdout: (value: unknown) => boolean;
  isSpawnedStderr: (value: unknown) => boolean;
  getSpawnedOptions: (params: { cliPath: string }) => unknown;
  getAllSpawnCalls: () => readonly unknown[][];
} => {
  const cliPathProxy = resolveClaudeCliPathProxy();
  const spawnProxy = spawnLiveProxy();

  const state: { cliPath: string } = { cliPath: DEFAULT_CLI_PATH };
  const config: {
    exitCode: number | null;
    error: Error | null;
    exitOnKill: boolean;
    exitCodeOnKill: number | null;
  } = { exitCode: null, error: null, exitOnKill: false, exitCodeOnKill: null };
  // Sticky: once set, every default child replays these lines on its stdout.
  const autoStdout: (readonly string[])[] = [];

  // Every child's streams, oldest first, so a test can push to the children spawned so far and a
  // composing proxy can address a spawned stream by identity.
  const spawnedStdouts: NonNullable<MockProcess['stdout']>[] = [];
  const spawnedStderrs: NonNullable<MockProcess['stderr']>[] = [];

  const createMockProcess = (): MockProcess => {
    const mockProcess = Object.assign(ChildProcessStub(), { kill: jest.fn() });
    if (mockProcess.stderr !== null) {
      spawnedStderrs.push(mockProcess.stderr);
    }
    if (mockProcess.stdout !== null) {
      spawnedStdouts.push(mockProcess.stdout);
    }

    if (config.exitOnKill) {
      // `.unref()`: a real child's 'exit' never blocks Node on its own, and most tests never drive
      // the loop far enough to observe this callback. Unref makes packages/testing's
      // isTimerHoldingLoopGuard read it as not holding the loop, while it still fires in the same
      // order for a caller that awaits it.
      mockProcess.kill.mockImplementation(() => {
        setImmediate(() => {
          mockProcess.emit('exit', config.exitCodeOnKill);
        }).unref();
        return true;
      });
    } else {
      mockProcess.kill.mockReturnValue(true);
      setImmediate(() => {
        if (config.error) {
          mockProcess.emit('error', config.error);
        } else if (config.exitCode !== null) {
          mockProcess.emit('exit', config.exitCode);
        }
      }).unref();
    }

    return mockProcess;
  };

  // A line reader attaches after the spawn returns, so the lines queue behind a microtask rather
  // than landing before the reader exists.
  const replayLines = ({
    mockProcess,
    lines,
  }: {
    mockProcess: MockProcess;
    lines: readonly string[];
  }): void => {
    const { stdout } = mockProcess;
    if (stdout !== null && lines.length > 0) {
      queueMicrotask(() => {
        stdout.push(lines.map((line) => `${line}\n`).join(''));
      });
    }
  };

  const stageDefaultChildren = (): void => {
    spawnProxy.setupChildFactory({
      command: state.cliPath,
      create: () => {
        const mockProcess = createMockProcess();
        replayLines({ mockProcess, lines: autoStdout.at(-1) ?? [] });
        return mockProcess;
      },
    });
  };

  cliPathProxy.setupOverride({ cliPath: state.cliPath });
  stageDefaultChildren();

  return {
    // One sticky child for every spawn of `cliPath`; the child is returned so a test drives it.
    setupSuccess: ({ cliPath }: { cliPath: string }): MockProcess => {
      state.cliPath = cliPath;
      cliPathProxy.setupOverride({ cliPath });
      const mockProcess = createMockProcess();
      spawnProxy.setupChildFactory({ command: cliPath, create: () => mockProcess });
      return mockProcess;
    },

    setupCliPath: ({ cliPath }: { cliPath: string }): void => {
      state.cliPath = cliPath;
      cliPathProxy.setupOverride({ cliPath });
      stageDefaultChildren();
    },

    // No override, no npm package, no `claude` on PATH: the real resolver throws its own error.
    setupCliNotInstalled: (): void => {
      cliPathProxy.setupNoOverride();
      cliPathProxy.setupNoNpmPackage();
      cliPathProxy.setupPathScan({ directories: [] });
    },

    // The next spawn gets this child, built now, so exit config set before this call is honoured.
    setupSpawn: (): { mockProcess: MockProcess } => {
      const mockProcess = createMockProcess();
      spawnProxy.setupChildFactoryOnce({ command: state.cliPath, create: () => mockProcess });
      return { mockProcess };
    },

    // The next spawn builds its child when spawn is CALLED, so exit config set after this call is
    // honoured; it never replays the sticky auto stdout lines.
    setupSpawnLazy: (): void => {
      spawnProxy.setupChildFactoryOnce({ command: state.cliPath, create: createMockProcess });
    },

    setupExitCode: ({ exitCode }: { exitCode: number }): void => {
      config.exitCode = exitCode;
      config.error = null;
      config.exitOnKill = false;
    },

    setupExitOnKill: ({ exitCode }: { exitCode: number | null }): void => {
      config.exitOnKill = true;
      config.exitCodeOnKill = exitCode;
      config.error = null;
    },

    setupError: ({ error }: { error: Error }): void => {
      config.error = error;
      config.exitCode = null;
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrows({ command: state.cliPath, error });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrowsOnce({ command: state.cliPath, error });
    },

    setupAutoStdoutLines: ({ lines }: { lines: readonly string[] }): void => {
      autoStdout.push(lines);
    },

    emitStdoutLines: ({ lines }: { lines: readonly string[] }): void => {
      for (const stdout of spawnedStdouts) {
        stdout.push(lines.map((line) => `${line}\n`).join(''));
      }
    },

    isSpawnedStdout: (value: unknown): boolean => spawnedStdouts.some((stdout) => stdout === value),

    isSpawnedStderr: (value: unknown): boolean => spawnedStderrs.some((stderr) => stderr === value),

    getSpawnedOptions: ({ cliPath }: { cliPath: string }): unknown =>
      spawnProxy.getSpawnedOptions({ command: cliPath }),

    // Every spawn of the current CLI path as its full `[command, args, options]` tuple, in call order.
    getAllSpawnCalls: (): readonly unknown[][] =>
      spawnProxy.getCallsFor({ command: state.cliPath }),
  };
};
