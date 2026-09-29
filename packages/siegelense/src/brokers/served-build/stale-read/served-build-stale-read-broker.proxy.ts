import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  ErrorMessageStub,
  ExitCodeStub,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import {
  childProcessSpawnCaptureAdapterProxy,
  cwdResolveBrokerProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import type { DevServerE2eProcess } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';

// `git check-ignore` is spawned as `git`, the changed-since walk as `sh`, so each is addressed by
// its own command. The repo root is the real process.cwd() processCwdAdapterProxy passes through,
// resolved "at start" — the same seed the broker reads.
export const servedBuildStaleReadBrokerProxy = (): {
  repoRoot: () => AbsoluteFilePath;
  setupLane: (params: { processes: readonly DevServerE2eProcess[]; buildCommand?: string }) => void;
  setupIgnored: (params: { paths: readonly string[] }) => void;
  setupNoneIgnored: () => void;
  setupNotARepository: () => void;
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
  processCwdAdapterProxy();
  const cwdProxy = cwdResolveBrokerProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  const spawnProxy = childProcessSpawnCaptureAdapterProxy();
  const statProxy = fsStatAdapterProxy();

  const cwdSeed = processCwdAdapter();
  cwdProxy.setupRepoRootFoundAtStart({ startPath: cwdSeed });
  const root = absoluteFilePathContract.parse(cwdSeed);
  const startPath = filePathContract.parse(
    `${cwdSeed}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
  );
  const enoent = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

  return {
    repoRoot: (): AbsoluteFilePath => root,

    setupLane: ({
      processes,
      buildCommand,
    }: {
      processes: readonly DevServerE2eProcess[];
      buildCommand?: string;
    }): void => {
      configProxy.setupConfigResolved({
        startPath,
        config: configProxy.makeConfigWithArgs({
          devServer: {
            devCommand: 'npm run dev',
            port: 3738,
            ...(buildCommand === undefined ? {} : { buildCommand }),
            e2e: { processes },
          },
        } as never),
      });
    },

    setupIgnored: ({ paths }: { paths: readonly string[] }): void => {
      spawnProxy.setupSuccess({
        command: 'git',
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: `${paths.join('\n')}\n` }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupNoneIgnored: (): void => {
      spawnProxy.setupSuccess({
        command: 'git',
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupNotARepository: (): void => {
      spawnProxy.setupSuccess({
        command: 'git',
        exitCode: ExitCodeStub({ value: 128 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({
          value: 'fatal: not a git repository (or any of the parent directories): .git\n',
        }),
      });
    },

    setupFolderBuiltAt: ({ outDir, builtAtMs }: { outDir: string; builtAtMs: number }): void => {
      statProxy.resolves({
        filePath: absoluteFilePathContract.parse(`${root}/${outDir}`),
        sizeBytes: 4096,
        modifiedAtMs: builtAtMs,
      });
    },

    setupFolderMissing: ({ outDir }: { outDir: string }): void => {
      statProxy.rejects({
        filePath: absoluteFilePathContract.parse(`${root}/${outDir}`),
        error: enoent,
      });
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
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: `${[baseCommit, ...files].join('\n')}\n` }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupNoCommitThatOld: (): void => {
      spawnProxy.setupSuccess({
        command: 'sh',
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupFileModifiedAt: ({ file, modifiedAtMs }: { file: string; modifiedAtMs: number }): void => {
      statProxy.resolves({
        filePath: absoluteFilePathContract.parse(`${root}/${file}`),
        sizeBytes: 100,
        modifiedAtMs,
      });
    },

    setupFileDeleted: ({ file }: { file: string }): void => {
      statProxy.rejects({
        filePath: absoluteFilePathContract.parse(`${root}/${file}`),
        error: enoent,
      });
    },

    getCheckIgnoreArgs: (): unknown => spawnProxy.getSpawnedArgs({ command: 'git' }),

    getChangedSinceArgs: (): unknown => spawnProxy.getSpawnedArgs({ command: 'sh' }),
  };
};
