import type { ExitCode, RepoRootCwd, StreamJsonLine } from '@dungeonmaster/shared/contracts';
import { repoRootCwdContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { spawn, type ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EventEmitter, Readable } from 'stream';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

interface ProxyConfig {
  exitCode: ExitCode | null;
  error: Error | null;
  stdoutData: readonly StreamJsonLine[];
  exitOnKill: boolean;
  exitCodeOnKill: ExitCode | null;
}

export const childProcessSpawnStreamJsonAdapterProxy = (): {
  setupSpawn: () => ChildProcess;
  setupSpawnLazy: () => void;
  setupSuccess: (params: { exitCode: ExitCode; stdoutData?: readonly StreamJsonLine[] }) => void;
  setupExitOnKill: (params: { exitCode: ExitCode | null }) => void;
  setupError: (params: { error: Error }) => void;
  setupSpawnThrow: (params: { error: Error }) => void;
  setupSpawnThrowOnce: (params: { error: Error }) => void;
  setupSettingsNotFound: () => void;
  setupSettingsJson: (params: { json: string }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
} => {
  // readFileSync's argument varies with the caller's cwd (`<cwd>/.claude/settings.json`),
  // which this proxy's zero-arg constructor never sees — cwd is a parameter of the SUT
  // call, chosen per test. The predicate matches the real shape of every settings read
  // the adapter performs regardless of cwd.
  const readFileMock: MockHandle = registerMock({ fn: readFileSync });
  const isSettingsFilePath = (filePath: unknown): boolean =>
    String(filePath).endsWith('settings.json');
  readFileMock.calledWith([isSettingsFilePath]).returns('{"hooks":{}}');

  // The adapter builds the settings path via raw `path.join(cwd, '.claude', 'settings.json')`
  // — the SAME npm `join` every `pathJoinAdapterProxy` in a composing test also mocks (e.g.
  // cwdResolveBrokerProxy's descendants, wired only to satisfy enforce-proxy-child-creation).
  // Those proxies queue their own `onceFor([])` entries for THEIR unrelated join calls; an
  // unconsumed live one-shot outranks the sticky real-passthrough default at equal (zero)
  // specificity, so this call can get answered with a stray path meant for something else,
  // which then fails the settings-file predicate above and silently drops `--settings`.
  // Address this exact 3-segment shape so it always wins on specificity over any `[]` staging,
  // regardless of what else composes this test or in what order.
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

  // childProcessSpawnStreamJsonAdapter resolves its command from
  // `process.env.CLAUDE_CLI_PATH ?? 'claude'`; CLAUDE_CLI_PATH is never overridden in this
  // package's tests, so 'claude' is the one real value spawn is ever called with here.
  const CLI_COMMAND = 'claude';

  const mock: MockHandle = registerMock({ fn: spawn });
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

  mock.calledWith([CLI_COMMAND]).implement(() => createMockChildProcess());

  return {
    setupSpawn: (): ChildProcess => {
      const mockChildProcess = createMockChildProcess();
      mock.onceFor([CLI_COMMAND]).returns(mockChildProcess);
      return mockChildProcess;
    },

    setupSpawnLazy: (): void => {
      mock.onceFor([CLI_COMMAND]).implement(() => createMockChildProcess());
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
      mock.calledWith([CLI_COMMAND]).implement(() => {
        throw error;
      });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      mock.onceFor([CLI_COMMAND]).implement(() => {
        throw error;
      });
    },

    setupSettingsNotFound: (): void => {
      readFileMock.calledWith([isSettingsFilePath]).implement(() => {
        throw new Error('ENOENT: no such file or directory');
      });
    },

    setupSettingsJson: ({ json }: { json: string }): void => {
      readFileMock.calledWith([isSettingsFilePath]).returns(json);
    },

    getSpawnedCommand: (): unknown => mock.callsMatching([CLI_COMMAND]).at(-1)?.[0],

    getSpawnedArgs: (): unknown => mock.callsMatching([CLI_COMMAND]).at(-1)?.[1],

    getSpawnedOptions: (): unknown => mock.callsMatching([CLI_COMMAND]).at(-1)?.[2],

    getSpawnedCwd: (): RepoRootCwd | undefined => {
      const lastCall = mock.callsMatching([CLI_COMMAND]).at(-1);
      if (!lastCall) return undefined;
      const [, , options] = lastCall;
      if (
        options === undefined ||
        options === null ||
        typeof options !== 'object' ||
        !('cwd' in options) ||
        options.cwd === undefined
      ) {
        return undefined;
      }
      return repoRootCwdContract.parse(options.cwd);
    },
  };
};
