import { spawnStreamJsonProxy } from '#gateway/bin/claude/spawn-stream-json/spawn-stream-json.proxy';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { join } from '#gateway/node/path';
import { envSnapshotProxy } from '#gateway/node/process/env-snapshot/env-snapshot.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { lineReaderProxy } from '#gateway/node/readline/line-reader/line-reader.proxy';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { SpawnOptionsEnvNameStub } from '../../../contracts/spawn-options-env-name/spawn-options-env-name.stub';
import { spawnedOptionsSnapshotTransformer } from '../../../transformers/spawned-options-snapshot/spawned-options-snapshot-transformer';

type MockProcess = ReturnType<ReturnType<typeof spawnStreamJsonProxy>['setupSpawn']>['mockProcess'];

const SETTINGS_JSON_DEFAULT = '{"hooks":{}}';

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
  isSpawnedStdout: (value: unknown) => boolean;
  isSpawnedStderr: (value: unknown) => boolean;
  setupSettingsNotFound: () => void;
  setupSettingsJson: (params: { json: string }) => void;
  getSpawnedArgs: () => unknown;
  getAllSpawnedArgs: () => readonly unknown[];
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => string | undefined;
  getSpawnedStdinMode: () => unknown;
  getSpawnedStderrMode: () => unknown;
  getSpawnedEnvValue: (params: { name: string }) => unknown;
  getSettingsReads: () => readonly unknown[][];
  getStderrWrites: () => readonly unknown[];
} => {
  lineReaderProxy();
  const spawnProxy = spawnStreamJsonProxy();
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

  // A spawn call is `[command, args, options]`; options carry `stdio: [stdin, 'pipe', stderr]`.
  const lastSpawnCall = (): readonly unknown[] | undefined => spawnProxy.getAllSpawnCalls().at(-1);
  const lastSpawnOptions = (): ReturnType<typeof spawnedOptionsSnapshotTransformer> =>
    spawnedOptionsSnapshotTransformer({ rawOptions: lastSpawnCall()?.[2] });

  return {
    setupSpawn: (): { mockProcess: MockProcess } => spawnProxy.setupSpawn(),

    setupSpawnLazy: (): void => {
      spawnProxy.setupSpawnLazy();
    },

    setupSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupExitCode({ exitCode });
    },

    setupExitOnKill: ({ exitCode }: { exitCode: ExitCode | null }): void => {
      spawnProxy.setupExitOnKill({ exitCode });
    },

    setupError: ({ error }: { error: Error }): void => {
      spawnProxy.setupError({ error });
    },

    setupSpawnThrow: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrow({ error });
    },

    setupSpawnThrowOnce: ({ error }: { error: Error }): void => {
      spawnProxy.setupSpawnThrowOnce({ error });
    },

    setupAutoStdoutLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.setupAutoStdoutLines({ lines });
    },

    emitStdoutLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.emitStdoutLines({ lines });
    },

    isSpawnedStdout: (value: unknown): boolean => spawnProxy.isSpawnedStdout(value),

    isSpawnedStderr: (value: unknown): boolean => spawnProxy.isSpawnedStderr(value),

    setupSettingsNotFound: (): void => {
      settingsProxy.throwsMatchingPath({
        path: isSettingsFilePath,
        error: FsErrorStub({ code: 'ENOENT', syscall: 'open' }),
      });
    },

    setupSettingsJson: ({ json }: { json: string }): void => {
      settingsProxy.returnsMatchingPath({ path: isSettingsFilePath, contents: json });
    },

    getSpawnedArgs: (): unknown => lastSpawnCall()?.[1],

    getAllSpawnedArgs: (): readonly unknown[] =>
      spawnProxy.getAllSpawnCalls().map(([, args]) => args),

    getSpawnedOptions: (): unknown => lastSpawnCall()?.[2],

    getSpawnedCwd: (): string | undefined => {
      const { cwd } = lastSpawnOptions();
      return cwd === undefined ? undefined : cwd;
    },

    getSpawnedStdinMode: (): unknown => lastSpawnOptions().stdio?.[0],

    getSpawnedStderrMode: (): unknown => lastSpawnOptions().stdio?.[2],

    getSpawnedEnvValue: ({ name }: { name: string }): unknown =>
      lastSpawnOptions().env?.[SpawnOptionsEnvNameStub({ value: name })],

    getSettingsReads: (): readonly unknown[][] => [
      ...settingsProxy.getCallsFor({ path: isSettingsFilePath }),
    ],

    getStderrWrites: (): readonly unknown[] => stderrRecorder.getWrites(),
  };
};
