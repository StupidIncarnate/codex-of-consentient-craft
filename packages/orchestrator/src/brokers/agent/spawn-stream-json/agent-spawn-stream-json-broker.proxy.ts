import { spawnStreamJson } from '#gateway/bin/claude';
import { spawnStreamJsonProxy } from '#gateway/bin/claude/spawn-stream-json/spawn-stream-json.proxy';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { ChildProcessStub } from '#gateway/node/child_process/child-process/child-process.stub';
import { join } from '#gateway/node/path';
import { envSnapshotProxy } from '#gateway/node/process/env-snapshot/env-snapshot.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { queueMicrotask } from '#gateway/node/queueMicrotask';
import { setImmediate } from '#gateway/node/setImmediate';
import { lineReaderProxy } from '#gateway/node/readline/line-reader/line-reader.proxy';
import type { ExitCode, RepoRootCwd } from '@dungeonmaster/shared/contracts';
import { repoRootCwdContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { SpawnOptionsEnvNameStub } from '../../../contracts/spawn-options-env-name/spawn-options-env-name.stub';
import { spawnedOptionsSnapshotTransformer } from '../../../transformers/spawned-options-snapshot/spawned-options-snapshot-transformer';

type MockProcess = ReturnType<typeof ChildProcessStub> & { kill: jest.Mock };

const SETTINGS_JSON_DEFAULT = '{"hooks":{}}';

// Every headless claude spawn passes `-p` as its first token; the prompt, model and flags after it
// are decided per call, so the argv's shape is the address.
const isClaudeArgv = (args: unknown): boolean => Array.isArray(args) && args[0] === '-p';

// The settings path is `<cwd>/.claude/settings.json`; cwd is a parameter of the call under test,
// chosen per test, which this proxy's zero-arg constructor never sees.
const isSettingsFilePath = (filePath: unknown): boolean =>
  String(filePath).endsWith(locationsStatics.repoRoot.claude.settings);

export const agentSpawnStreamJsonBrokerProxy = (): {
  setupSpawn: () => { mockProcess: MockProcess };
  setupSpawnLazy: () => void;
  setupSuccess: (params: { exitCode: ExitCode }) => void;
  setupExitOnKill: (params: { exitCode: ExitCode | null }) => void;
  setupError: (params: { error: Error }) => void;
  setupSpawnThrow: (params: { error: Error }) => void;
  setupSpawnThrowOnce: (params: { error: Error }) => void;
  setupAutoStdoutLines: (params: { lines: readonly string[] }) => void;
  emitStdoutLines: (params: { lines: readonly string[] }) => void;
  setupSettingsNotFound: () => void;
  setupSettingsJson: (params: { json: string }) => void;
  getSpawnedArgs: () => unknown;
  getAllSpawnedArgs: () => readonly unknown[];
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
  getSpawnedStdinMode: () => unknown;
  getSpawnedStderrMode: () => unknown;
  getSpawnedEnvValue: (params: { name: string }) => unknown;
  getSettingsReads: () => readonly unknown[][];
  getStderrWrites: () => readonly unknown[];
} => {
  lineReaderProxy();
  spawnStreamJsonProxy();
  // Record-and-swallow: the tagging path narrates a failing callback to stderr, and the line text
  // is what a test asserts, read back through getStderrWrites.
  const stderrRecorder = stderrProxy();
  // The broker reads the real environment; composed because it imports envSnapshot.
  envSnapshotProxy();
  const settingsProxy = readFileSyncIfExistsProxy();
  settingsProxy.returnsMatchingPath({ path: isSettingsFilePath, contents: SETTINGS_JSON_DEFAULT });

  // `join` is one shared handle: sibling proxies composed in a test queue their own `onceFor` joins
  // for unrelated paths, and an unconsumed live one-shot outranks a sticky default at equal
  // specificity, so this call could be answered with a stray path meant for something else — which
  // fails the settings predicate above and silently drops `--settings`. This exact 3-segment
  // shape always wins on specificity over any address-less staging.
  const isClaudeDirSegment = (segment: unknown): boolean =>
    segment === locationsStatics.repoRoot.claude.dir;
  const isSettingsFileSegment = (segment: unknown): boolean =>
    segment === locationsStatics.repoRoot.claude.settings;
  const realJoin = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinMock: MockHandle = registerMock({ fn: join });
  joinMock
    .calledWith([
      (segment: unknown): boolean => typeof segment === 'string',
      isClaudeDirSegment,
      isSettingsFileSegment,
    ])
    .implement((...segments: never[]) => realJoin.join(...segments));

  const spawnMock: MockHandle = registerMock({ fn: spawnStreamJson });
  const address = [{ args: isClaudeArgv }];
  const config: {
    exitCode: ExitCode | null;
    error: Error | null;
    exitOnKill: boolean;
    exitCodeOnKill: ExitCode | null;
  } = {
    exitCode: null,
    error: null,
    exitOnKill: false,
    exitCodeOnKill: null,
  };
  // Sticky: once set, every default child replays these lines on its stdout.
  const autoStdout: Parameters<
    ReturnType<typeof agentSpawnStreamJsonBrokerProxy>['setupAutoStdoutLines']
  >[0][] = [];

  // Every child's stdout, oldest first, so a test can push lines to the children spawned so far.
  const spawnedStdouts: NonNullable<MockProcess['stdout']>[] = [];

  const createMockProcess = (): MockProcess => {
    const mockProcess = Object.assign(ChildProcessStub(), { kill: jest.fn() });
    if (mockProcess.stdout !== null) {
      spawnedStdouts.push(mockProcess.stdout);
    }

    if (config.exitOnKill) {
      // Exit only when kill() is called (for timeout testing)
      mockProcess.kill.mockImplementation(() => {
        // `.unref()`: a real child's 'exit' never blocks Node on its own, and most tests here never
        // drive the loop far enough to observe this callback (they assert argv/options, not
        // lifecycle). Unref makes packages/testing's isTimerHoldingLoopGuard read it as not
        // holding the loop, so it stops reporting as a leaked handle, while still firing in the
        // same order for callers (chat-spawn-broker, agent-launch-broker) that DO await it.
        setImmediate(() => {
          mockProcess.emit('exit', config.exitCodeOnKill);
        }).unref();
        return true;
      });
    } else {
      mockProcess.kill.mockReturnValue(true);
      // Schedule exit or error emission asynchronously; `.unref()` for the same reason as above.
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

  const spawnResultFor = ({
    mockProcess,
    autoLines,
  }: {
    mockProcess: MockProcess;
    autoLines: readonly string[];
  }): { process: MockProcess; stdout: NonNullable<MockProcess['stdout']> } => {
    const { stdout } = mockProcess;
    if (stdout === null) {
      throw new Error('agentSpawnStreamJsonBrokerProxy: ChildProcessStub produced no stdout');
    }
    if (autoLines.length > 0) {
      // A line reader attaches after this returns, so the lines queue behind a microtask rather
      // than landing before the reader exists.
      queueMicrotask(() => {
        stdout.push(autoLines.map((line) => `${line}\n`).join(''));
      });
    }
    return { process: mockProcess, stdout };
  };

  spawnMock.calledWith(address).implement(() => {
    const mockProcess = createMockProcess();
    return spawnResultFor({ mockProcess, autoLines: autoStdout.at(-1)?.lines ?? [] });
  });

  return {
    setupSpawn: (): { mockProcess: MockProcess } => {
      const mockProcess = createMockProcess();
      spawnMock.onceFor(address).returns({ process: mockProcess, stdout: mockProcess.stdout });
      return { mockProcess };
    },

    // The child is built when spawn is CALLED, so exit config set after this call is honoured, and
    // it never replays the sticky auto stdout lines.
    setupSpawnLazy: (): void => {
      spawnMock.onceFor(address).implement(() => {
        const mockProcess = createMockProcess();
        return spawnResultFor({ mockProcess, autoLines: [] });
      });
    },

    setupSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      config.exitCode = exitCode;
      config.error = null;
      config.exitOnKill = false;
    },

    setupExitOnKill: ({ exitCode }: { exitCode: ExitCode | null }): void => {
      config.exitOnKill = true;
      config.exitCodeOnKill = exitCode;
      config.error = null;
    },

    setupError: ({ error }: { error: Error }): void => {
      config.error = error;
      config.exitCode = null;
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnMock.calledWith(address).implement(() => {
        throw error;
      });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnMock.onceFor(address).implement(() => {
        throw error;
      });
    },

    setupAutoStdoutLines: ({ lines }: { lines: readonly string[] }): void => {
      autoStdout.push({ lines });
    },

    emitStdoutLines: ({ lines }: { lines: readonly string[] }): void => {
      for (const stdout of spawnedStdouts) {
        stdout.push(lines.map((line) => `${line}\n`).join(''));
      }
    },

    setupSettingsNotFound: (): void => {
      settingsProxy.throwsMatchingPath({
        path: isSettingsFilePath,
        error: FsErrorStub({ code: 'ENOENT', syscall: 'open' }),
      });
    },

    setupSettingsJson: ({ json }: { json: string }): void => {
      settingsProxy.returnsMatchingPath({ path: isSettingsFilePath, contents: json });
    },

    getSpawnedArgs: (): unknown =>
      spawnedOptionsSnapshotTransformer({
        rawOptions: spawnMock.callsMatching(address).at(-1)?.[0],
      }).args,

    getAllSpawnedArgs: (): readonly unknown[] =>
      spawnMock
        .callsMatching(address)
        .map(([options]) => spawnedOptionsSnapshotTransformer({ rawOptions: options }).args),

    getSpawnedOptions: (): unknown => spawnMock.callsMatching(address).at(-1)?.[0],

    getSpawnedCwd: (): RepoRootCwd | undefined => {
      const { cwd } = spawnedOptionsSnapshotTransformer({
        rawOptions: spawnMock.callsMatching(address).at(-1)?.[0],
      });
      return cwd === undefined ? undefined : repoRootCwdContract.parse(cwd);
    },

    getSpawnedStdinMode: (): unknown =>
      spawnedOptionsSnapshotTransformer({
        rawOptions: spawnMock.callsMatching(address).at(-1)?.[0],
      }).stdinMode,

    getSpawnedStderrMode: (): unknown =>
      spawnedOptionsSnapshotTransformer({
        rawOptions: spawnMock.callsMatching(address).at(-1)?.[0],
      }).stderrMode,

    getSpawnedEnvValue: ({ name }: { name: string }): unknown => {
      const { env } = spawnedOptionsSnapshotTransformer({
        rawOptions: spawnMock.callsMatching(address).at(-1)?.[0],
      });
      return env?.[SpawnOptionsEnvNameStub({ value: name })];
    },

    getSettingsReads: (): readonly unknown[][] => [
      ...settingsProxy.getCallsFor({ path: isSettingsFilePath }),
    ],

    getStderrWrites: (): readonly unknown[] => stderrRecorder.getWrites(),
  };
};
