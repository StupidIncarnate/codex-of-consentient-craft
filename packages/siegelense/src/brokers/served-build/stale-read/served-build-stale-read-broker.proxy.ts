import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import type { DevServerE2eProcess } from '@dungeonmaster/config';
import { configResolveBrokerProxy } from '@dungeonmaster/config/startup/start-config.proxy';

import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';

// `git check-ignore` is spawned as `git`, the changed-since walk as `sh`, so each is addressed by
// its own command. The repo root is the cwd staged below, resolved "at start" — the same seed the
// broker reads.
export const servedBuildStaleReadBrokerProxy = (): {
  repoRoot: () => string;
  setupLane: (params: { processes: readonly DevServerE2eProcess[]; buildCommand?: string }) => void;
  setupIgnored: (params: { paths: readonly string[] }) => void;
  setupNoneIgnored: () => void;
  setupNotARepository: () => void;
  setupGitNotInstalled: () => void;
  setupFolderBuiltAt: (params: { outDir: string; builtAtMs: number }) => void;
  setupFolderMissing: (params: { outDir: string }) => void;
  setupChangedSince: (params: { baseCommit: string; files: readonly string[] }) => void;
  setupNoCommitThatOld: () => void;
  setupFileModifiedAt: (params: { file: string; modifiedAtMs: number }) => void;
  setupFileDeleted: (params: { file: string }) => void;
  getCheckIgnoreArgs: () => unknown;
  getChangedSinceArgs: () => unknown;
} => {
  laneSpecFindBrokerProxy();
  const cwdStagingProxy = cwdProxy();
  const cwdResolveProxy = cwdResolveBrokerProxy();
  const configProxy = configResolveBrokerProxy();
  RunNotFoundErrorProxy();
  const spawnProxy = runProxy();
  const statProxy = statIfExistsProxy();

  const root = '/default/cwd';
  cwdStagingProxy.setupCwd({ value: root });
  cwdResolveProxy.setupRepoRootFoundAtStart({ startPath: root });
  const startPath = `${root}/${dungeonmasterHomeStatics.paths.projectConfigFile}`;

  return {
    repoRoot: (): string => root,

    setupLane: ({
      processes,
      buildCommand,
    }: {
      processes: readonly DevServerE2eProcess[];
      buildCommand?: string;
    }): void => {
      configProxy.setupResolves({
        filePath: startPath,
        config: DungeonmasterConfigStub({
          devServer: {
            devCommand: 'npm run dev',
            port: 3738,
            ...(buildCommand === undefined ? {} : { buildCommand }),
            e2e: { processes: [...processes] },
          },
        }),
      });
    },

    setupIgnored: ({ paths }: { paths: readonly string[] }): void => {
      spawnProxy.setupSuccess({
        command: 'git',
        exitCode: 0,
        stdout: `${paths.join('\n')}\n`,
        stderr: '',
      });
    },

    setupNoneIgnored: (): void => {
      spawnProxy.setupSuccess({
        command: 'git',
        exitCode: 1,
        stdout: '',
        stderr: '',
      });
    },

    setupNotARepository: (): void => {
      spawnProxy.setupSuccess({
        command: 'git',
        exitCode: 128,
        stdout: '',
        stderr: 'fatal: not a git repository (or any of the parent directories): .git\n',
      });
    },

    setupGitNotInstalled: (): void => {
      spawnProxy.setupError({ command: 'git', error: FileMissingErrorStub({ path: 'git' }) });
    },

    setupFolderBuiltAt: ({ outDir, builtAtMs }: { outDir: string; builtAtMs: number }): void => {
      statProxy.returnsFile({
        path: `${root}/${outDir}`,
        sizeBytes: 4096,
        modifiedAtMs: builtAtMs,
      });
    },

    setupFolderMissing: ({ outDir }: { outDir: string }): void => {
      statProxy.missing({ path: `${root}/${outDir}` });
    },

    setupChangedSince: ({
      baseCommit,
      files,
    }: {
      baseCommit: string;
      files: readonly string[];
    }): void => {
      spawnProxy.setupSuccess({
        command: 'sh',
        exitCode: 0,
        stdout: `${[baseCommit, ...files].join('\n')}\n`,
        stderr: '',
      });
    },

    setupNoCommitThatOld: (): void => {
      spawnProxy.setupSuccess({
        command: 'sh',
        exitCode: 1,
        stdout: '',
        stderr: '',
      });
    },

    setupFileModifiedAt: ({ file, modifiedAtMs }: { file: string; modifiedAtMs: number }): void => {
      statProxy.returnsFile({
        path: `${root}/${file}`,
        sizeBytes: 100,
        modifiedAtMs,
      });
    },

    setupFileDeleted: ({ file }: { file: string }): void => {
      statProxy.missing({ path: `${root}/${file}` });
    },

    getCheckIgnoreArgs: (): unknown => spawnProxy.getCallsFor({ command: 'git' }).at(-1),

    getChangedSinceArgs: (): unknown => spawnProxy.getCallsFor({ command: 'sh' }).at(-1),
  };
};
