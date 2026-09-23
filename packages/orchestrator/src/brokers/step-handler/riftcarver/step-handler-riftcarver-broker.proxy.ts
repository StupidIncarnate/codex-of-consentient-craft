/**
 * PURPOSE: Proxy for stepHandlerRiftcarverBroker — mocks ONLY the child-process and fs adapter
 * boundaries and backs them with a virtual quest-file store plus a virtual git/worktree world, so
 * every broker between them (worktreePrepareBroker, worktreeProvisionBroker and the mirror, seed
 * and audit under it, questModifyBroker, questOperationsUpdateBroker) runs REAL — minus
 * questAdvanceBroker and questBlockOnFailureBroker (this handler never routes, so neither is
 * wired) and minus the work-item status tracking (this handler never stamps one).
 *
 * USAGE:
 * const proxy = stepHandlerRiftcarverBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.setupTypecheckFails({ lines: ['error TS2304'] });
 * const result = await stepHandlerRiftcarverBroker({ args: [], questId, workItemId, onLine: () => undefined });
 */

import { Dirent } from 'fs';
import type { join } from 'path';

import {
  childProcessSpawnCaptureAdapter,
  childProcessSpawnStreamLinesAdapter,
  fsMkdirAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import {
  childProcessSpawnStreamLinesAdapterProxy,
  locationsWorktreePathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import {
  adapterResultContract,
  errorMessageContract,
  exitCodeContract,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  questContract,
  type ErrorMessage,
  type ExitCode,
  type FileContents,
  type FileName,
  type FilePath,
  type Quest,
  type QuestStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadlinkAdapter } from '../../../adapters/fs/readlink/fs-readlink-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsSymlinkAdapter } from '../../../adapters/fs/symlink/fs-symlink-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { gitCurrentBranchAdapterProxy } from '../../../adapters/git/current-branch/git-current-branch-adapter.proxy';
import { gitHeadShaAdapterProxy } from '../../../adapters/git/head-sha/git-head-sha-adapter.proxy';
import { gitPushAdapterProxy } from '../../../adapters/git/push/git-push-adapter.proxy';
import { gitUpstreamShaAdapterProxy } from '../../../adapters/git/upstream-sha/git-upstream-sha-adapter.proxy';
import { gitVerifyRefAdapterProxy } from '../../../adapters/git/verify-ref/git-verify-ref-adapter.proxy';
import { gitDetectBaseBranchBrokerProxy } from '../../git/detect-base-branch/git-detect-base-branch-broker.proxy';
import { riftcarverPersistResultBrokerProxy } from '../../riftcarver/persist-result/riftcarver-persist-result-broker.proxy';
import { worktreePrepareBrokerProxy } from '../../worktree/prepare/worktree-prepare-broker.proxy';
import { worktreeProvisionBrokerProxy } from '../../worktree/provision/worktree-provision-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../quest/operations-update/quest-operations-update-broker.proxy';
import { questRepoRootBrokerProxy } from '../../quest/repo-root/quest-repo-root-broker.proxy';

// Module-level mocks (hoisted as jest.mock by the AST transformer). Adapter-level mocking is
// deliberate: routing is registry-global, so the virtual stores below serve EVERY broker in the
// chain regardless of which async tick a call lands on.
registerModuleMock({
  module: '@dungeonmaster/shared/adapters',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    childProcessSpawnCaptureAdapter: jest.fn(),
    childProcessSpawnStreamLinesAdapter: jest.fn(),
    fsMkdirAdapter: jest.fn(),
    fsReaddirWithTypesAdapter: jest.fn(),
    pathJoinAdapter: jest.fn(),
  }),
});
registerModuleMock({
  module: '@dungeonmaster/shared/brokers',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/brokers'),
    dungeonmasterHomeFindBroker: jest.fn(),
  }),
});
registerModuleMock({ module: '../../../adapters/fs/append-file/fs-append-file-adapter' });
registerModuleMock({ module: '../../../adapters/fs/is-accessible/fs-is-accessible-adapter' });
registerModuleMock({ module: '../../../adapters/fs/read-file/fs-read-file-adapter' });
registerModuleMock({ module: '../../../adapters/fs/readlink/fs-readlink-adapter' });
registerModuleMock({ module: '../../../adapters/fs/rename/fs-rename-adapter' });
registerModuleMock({ module: '../../../adapters/fs/symlink/fs-symlink-adapter' });
registerModuleMock({ module: '../../../adapters/fs/write-file/fs-write-file-adapter' });

type QuestInput = ReturnType<typeof QuestStub>;
// Wrapped in Readonly<> (rather than a bare object literal) so consistent-type-definitions does not
// autofix these into interfaces, which ban-adhoc-types then bans in brokers/ files.
type DirEntry = Readonly<{ name: FileName; isDir: boolean; isSymlink: boolean }>;
type SpawnRecord = Readonly<{ command: unknown; args: readonly unknown[]; cwd: unknown }>;

const HOME_PATH = '/home/testuser/.dungeonmaster';
const GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const GUILDS_DIR = `${HOME_PATH}/guilds`;
const QUESTS_DIR = `${GUILDS_DIR}/${GUILD_ID}/quests`;

const REPO_ROOT = '/repo';
// Derived by questToGitNamesTransformer from QuestStub's own title ('Add Authentication') and id
// ('add-auth') — the same derivation the broker runs, restated here so the virtual git world can be
// addressed by the exact paths the implementation will reach for.
const BRANCH_NAME = 'quest/add-authentication-add-auth';
const WORKTREE_PATH = `${REPO_ROOT}/worktrees/add-authentication-add-auth`;
const WORKSPACE_PACKAGE = 'shared';
const HEAD_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

const FIXED_RIFTCARVER_RESULT_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

const GIT_SUCCESS = 0;
const GIT_FAILURE = 128;
const TYPECHECK_FAILURE = 1;

const buildDirent = ({ name, isDir, isSymlink }: DirEntry): Dirent =>
  Object.assign(Object.create(Dirent.prototype) as Dirent, {
    name: String(name),
    isDirectory: (): boolean => isDir,
    isFile: (): boolean => !isDir && !isSymlink,
    isSymbolicLink: (): boolean => isSymlink,
  });

export const stepHandlerRiftcarverBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  setupNoBaseBranch: () => void;
  setupBranchExistsInGit: () => void;
  setupWorktreeAddFails: (params: { output: string }) => void;
  setupWorktreeAddPermissionDenied: () => void;
  setupExistingWorktree: () => void;
  setupAlreadyPushed: () => void;
  setupPushFails: (params: { output: string }) => void;
  setupTypecheckFails: (params: { lines: readonly string[] }) => void;
  getPersistedQuest: () => Quest;
  getWorktreeAddSpawns: () => readonly unknown[];
  getTypecheckSpawns: () => readonly unknown[];
  getRiftcarverLogWrites: () => readonly { path: unknown; contents: unknown }[];
} => {
  childProcessSpawnStreamLinesAdapterProxy();
  locationsWorktreePathFindBrokerProxy();
  fsIsAccessibleAdapterProxy();
  gitCurrentBranchAdapterProxy();
  gitHeadShaAdapterProxy();
  gitPushAdapterProxy();
  gitUpstreamShaAdapterProxy();
  gitVerifyRefAdapterProxy();
  gitDetectBaseBranchBrokerProxy();
  riftcarverPersistResultBrokerProxy();
  worktreePrepareBrokerProxy();
  worktreeProvisionBrokerProxy();
  questFindQuestPathBrokerProxy();
  questGetBrokerProxy();
  questOperationsUpdateBrokerProxy();
  const repoRootProxy = questRepoRootBrokerProxy();
  repoRootProxy.setupRepoRoot({ repoRoot: REPO_ROOT as never });

  const files = new Map<FilePath, FileContents>();
  const dirEntries = new Map<FilePath, DirEntry[]>();
  const accessiblePaths = new Set<FilePath>();
  const readlinkTargets = new Map<FilePath, FilePath>();
  const symlinkCalls: { target: unknown; linkPath: unknown }[] = [];
  const spawnCaptureCalls: SpawnRecord[] = [];
  const spawnStreamCalls: SpawnRecord[] = [];
  const questFilePathRef = { value: filePathContract.parse('/unset/quest.json') };

  const existingRefs = new Set<FileName>([fileNameContract.parse('main')]);
  const worktreeBranches = new Map<FilePath, FileName>();
  const worktreeAddOutcome: { exitCode: ExitCode; output: ErrorMessage } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    output: errorMessageContract.parse(''),
  };
  const upstreamSha: { value: ErrorMessage | null } = { value: null };
  const pushOutcome: { exitCode: ExitCode; output: ErrorMessage } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    output: errorMessageContract.parse(''),
  };
  const typecheckOutcome: { exitCode: ExitCode; lines: readonly ErrorMessage[] } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    lines: [errorMessageContract.parse('✓ typecheck')],
  };

  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const pathJoinHandle = registerMock({ fn: pathJoinAdapter });
  const pathJoinImpl = ({ paths }: Parameters<typeof pathJoinAdapter>[0]): FilePath =>
    filePathContract.parse(realPath.join(...paths));
  pathJoinHandle.calledWith([]).implement(pathJoinImpl as never);

  const dungeonmasterHomeFindHandle = registerMock({ fn: dungeonmasterHomeFindBroker });
  const dungeonmasterHomeFindImpl = (): { homePath: FilePath } => ({
    homePath: filePathContract.parse(HOME_PATH),
  });
  dungeonmasterHomeFindHandle.calledWith([]).implement(dungeonmasterHomeFindImpl as never);

  const fsReaddirWithTypesHandle = registerMock({ fn: fsReaddirWithTypesAdapter });
  const fsReaddirWithTypesImpl = ({
    dirPath,
  }: Parameters<typeof fsReaddirWithTypesAdapter>[0]): Dirent[] =>
    (dirEntries.get(filePathContract.parse(String(dirPath))) ?? []).map((entry) =>
      buildDirent(entry),
    );
  fsReaddirWithTypesHandle.calledWith([]).implement(fsReaddirWithTypesImpl as never);

  const fsIsAccessibleHandle = registerMock({ fn: fsIsAccessibleAdapter });
  const fsIsAccessibleImpl = async ({
    filePath,
  }: Parameters<typeof fsIsAccessibleAdapter>[0]): Promise<boolean> =>
    Promise.resolve(accessiblePaths.has(filePathContract.parse(String(filePath))));
  fsIsAccessibleHandle.calledWith([]).implement(fsIsAccessibleImpl as never);

  const fsReadlinkHandle = registerMock({ fn: fsReadlinkAdapter });
  const fsReadlinkImpl = async ({
    linkPath,
  }: Parameters<typeof fsReadlinkAdapter>[0]): Promise<FilePath | null> => {
    const target = readlinkTargets.get(filePathContract.parse(String(linkPath)));
    return Promise.resolve(target ?? null);
  };
  fsReadlinkHandle.calledWith([]).implement(fsReadlinkImpl as never);

  const fsSymlinkHandle = registerMock({ fn: fsSymlinkAdapter });
  const fsSymlinkImpl = async ({
    target,
    linkPath,
  }: Parameters<typeof fsSymlinkAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    symlinkCalls.push({ target: String(target), linkPath: String(linkPath) });
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsSymlinkHandle.calledWith([]).implement(fsSymlinkImpl as never);

  const fsReadFileHandle = registerMock({ fn: fsReadFileAdapter });
  const fsReadFileImpl = async ({
    filePath,
  }: Parameters<typeof fsReadFileAdapter>[0]): Promise<FileContents> => {
    const contents = files.get(filePathContract.parse(String(filePath)));
    if (contents === undefined) {
      return Promise.reject(new Error(`Failed to read file at ${String(filePath)}`));
    }
    return Promise.resolve(contents);
  };
  fsReadFileHandle.calledWith([]).implement(fsReadFileImpl as never);

  const fsWriteFileHandle = registerMock({ fn: fsWriteFileAdapter });
  const fsWriteFileImpl = async ({
    filePath,
    contents,
  }: Parameters<typeof fsWriteFileAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    files.set(
      filePathContract.parse(String(filePath)),
      fileContentsContract.parse(String(contents)),
    );
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsWriteFileHandle.calledWith([]).implement(fsWriteFileImpl as never);

  const fsRenameHandle = registerMock({ fn: fsRenameAdapter });
  const fsRenameImpl = async ({
    from,
    to,
  }: Parameters<typeof fsRenameAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    const fromPath = filePathContract.parse(String(from));
    const contents = files.get(fromPath);
    files.delete(fromPath);
    if (contents !== undefined) {
      files.set(filePathContract.parse(String(to)), contents);
    }
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsRenameHandle.calledWith([]).implement(fsRenameImpl as never);

  const fsAppendFileHandle = registerMock({ fn: fsAppendFileAdapter });
  const fsAppendFileImpl = async (): Promise<ReturnType<typeof adapterResultContract.parse>> =>
    Promise.resolve(adapterResultContract.parse({ success: true }));
  fsAppendFileHandle.calledWith([]).implement(fsAppendFileImpl as never);

  const fsMkdirHandle = registerMock({ fn: fsMkdirAdapter });
  const fsMkdirImpl = async (): Promise<ReturnType<typeof adapterResultContract.parse>> =>
    Promise.resolve(adapterResultContract.parse({ success: true }));
  fsMkdirHandle.calledWith([]).implement(fsMkdirImpl as never);

  const spawnCaptureHandle = registerMock({ fn: childProcessSpawnCaptureAdapter });
  const spawnCaptureImpl = async ({
    command,
    args,
    cwd,
  }: Parameters<typeof childProcessSpawnCaptureAdapter>[0]): Promise<{
    exitCode: ExitCode;
    output: ErrorMessage;
  }> => {
    spawnCaptureCalls.push({ command, args: [...args], cwd: String(cwd) });
    const [first, second, third] = args;

    if (first === 'rev-parse' && second === '--verify') {
      const exists = existingRefs.has(fileNameContract.parse(String(third)));
      return Promise.resolve({
        exitCode: exitCodeContract.parse(exists ? GIT_SUCCESS : GIT_FAILURE),
        output: errorMessageContract.parse(''),
      });
    }

    if (first === 'rev-parse' && second === '--abbrev-ref') {
      const branch = worktreeBranches.get(filePathContract.parse(String(cwd)));
      return Promise.resolve(
        branch === undefined
          ? {
              exitCode: exitCodeContract.parse(GIT_FAILURE),
              output: errorMessageContract.parse('fatal: not a git repository'),
            }
          : {
              exitCode: exitCodeContract.parse(GIT_SUCCESS),
              output: errorMessageContract.parse(`${String(branch)}\n`),
            },
      );
    }

    if (first === 'rev-parse' && second === 'HEAD') {
      return Promise.resolve({
        exitCode: exitCodeContract.parse(GIT_SUCCESS),
        output: errorMessageContract.parse(`${HEAD_SHA}\n`),
      });
    }

    if (first === 'rev-parse' && second === '@{upstream}') {
      const tracked = upstreamSha.value;
      return Promise.resolve(
        tracked === null
          ? {
              exitCode: exitCodeContract.parse(GIT_FAILURE),
              output: errorMessageContract.parse('fatal: no upstream configured'),
            }
          : {
              exitCode: exitCodeContract.parse(GIT_SUCCESS),
              output: errorMessageContract.parse(`${String(tracked)}\n`),
            },
      );
    }

    if (first === 'push') {
      return Promise.resolve({ exitCode: pushOutcome.exitCode, output: pushOutcome.output });
    }

    if (first === 'worktree' && second === 'prune') {
      return Promise.resolve({
        exitCode: exitCodeContract.parse(GIT_SUCCESS),
        output: errorMessageContract.parse(''),
      });
    }

    if (first === 'worktree' && second === 'add') {
      if (Number(worktreeAddOutcome.exitCode) === GIT_SUCCESS) {
        const addedBranch = args[3] === '-b' ? args[4] : args[3];
        accessiblePaths.add(filePathContract.parse(String(third)));
        worktreeBranches.set(
          filePathContract.parse(String(third)),
          fileNameContract.parse(String(addedBranch)),
        );
      }
      return Promise.resolve({
        exitCode: worktreeAddOutcome.exitCode,
        output: worktreeAddOutcome.output,
      });
    }

    return Promise.resolve({
      exitCode: exitCodeContract.parse(GIT_SUCCESS),
      output: errorMessageContract.parse(''),
    });
  };
  spawnCaptureHandle.calledWith([]).implement(spawnCaptureImpl as never);

  const spawnStreamHandle = registerMock({ fn: childProcessSpawnStreamLinesAdapter });
  const spawnStreamImpl = async ({
    command,
    args,
    cwd,
    onLine,
  }: Parameters<typeof childProcessSpawnStreamLinesAdapter>[0]): Promise<{
    exitCode: ExitCode;
    output: ErrorMessage;
  }> => {
    spawnStreamCalls.push({ command, args: [...args], cwd: String(cwd) });
    for (const line of typecheckOutcome.lines) {
      onLine(String(line));
    }
    return Promise.resolve({
      exitCode: typecheckOutcome.exitCode,
      output: errorMessageContract.parse(typecheckOutcome.lines.join('\n')),
    });
  };
  spawnStreamHandle.calledWith([]).implement(spawnStreamImpl as never);

  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  uuidSpy
    .calledWith([])
    .returns(FIXED_RIFTCARVER_RESULT_UUID as ReturnType<typeof crypto.randomUUID>);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      const questFilePath = filePathContract.parse(
        `${QUESTS_DIR}/${String(quest.folder)}/quest.json`,
      );
      dirEntries.set(filePathContract.parse(GUILDS_DIR), [
        { name: fileNameContract.parse(GUILD_ID), isDir: true, isSymlink: false },
      ]);
      dirEntries.set(filePathContract.parse(QUESTS_DIR), [
        { name: fileNameContract.parse(String(quest.folder)), isDir: true, isSymlink: false },
      ]);
      files.set(questFilePath, fileContentsContract.parse(JSON.stringify(quest)));
      questFilePathRef.value = questFilePath;

      dirEntries.set(filePathContract.parse(`${REPO_ROOT}/node_modules`), [
        { name: fileNameContract.parse('@dungeonmaster'), isDir: true, isSymlink: false },
      ]);
      dirEntries.set(filePathContract.parse(`${REPO_ROOT}/node_modules/@dungeonmaster`), [
        { name: fileNameContract.parse(WORKSPACE_PACKAGE), isDir: false, isSymlink: true },
      ]);
      dirEntries.set(
        filePathContract.parse(`${REPO_ROOT}/packages/${WORKSPACE_PACKAGE}/node_modules`),
        [{ name: fileNameContract.parse('zod'), isDir: true, isSymlink: false }],
      );
      readlinkTargets.set(
        filePathContract.parse(`${REPO_ROOT}/node_modules/@dungeonmaster/${WORKSPACE_PACKAGE}`),
        filePathContract.parse(`../../packages/${WORKSPACE_PACKAGE}`),
      );
      accessiblePaths.add(
        filePathContract.parse(`${REPO_ROOT}/packages/${WORKSPACE_PACKAGE}/node_modules`),
      );
    },

    setupNoBaseBranch: (): void => {
      existingRefs.clear();
    },

    setupBranchExistsInGit: (): void => {
      existingRefs.add(fileNameContract.parse(BRANCH_NAME));
    },

    setupWorktreeAddFails: ({ output }: { output: string }): void => {
      worktreeAddOutcome.exitCode = exitCodeContract.parse(GIT_FAILURE);
      worktreeAddOutcome.output = errorMessageContract.parse(output);
    },

    setupWorktreeAddPermissionDenied: (): void => {
      worktreeAddOutcome.exitCode = exitCodeContract.parse(GIT_FAILURE);
      worktreeAddOutcome.output = errorMessageContract.parse(
        `fatal: cannot mkdir ${WORKTREE_PATH}: Permission denied`,
      );
    },

    setupExistingWorktree: (): void => {
      accessiblePaths.add(filePathContract.parse(WORKTREE_PATH));
      worktreeBranches.set(
        filePathContract.parse(WORKTREE_PATH),
        fileNameContract.parse(BRANCH_NAME),
      );
      existingRefs.add(fileNameContract.parse(BRANCH_NAME));
    },

    setupAlreadyPushed: (): void => {
      upstreamSha.value = errorMessageContract.parse(HEAD_SHA);
    },

    setupPushFails: ({ output }: { output: string }): void => {
      pushOutcome.exitCode = exitCodeContract.parse(GIT_FAILURE);
      pushOutcome.output = errorMessageContract.parse(output);
    },

    setupTypecheckFails: ({ lines }: { lines: readonly string[] }): void => {
      typecheckOutcome.exitCode = exitCodeContract.parse(TYPECHECK_FAILURE);
      typecheckOutcome.lines = lines.map((line) => errorMessageContract.parse(line));
    },

    getPersistedQuest: (): Quest => {
      const contents = files.get(questFilePathRef.value);
      if (contents === undefined) {
        throw new Error('stepHandlerRiftcarverBrokerProxy: no quest file persisted');
      }
      return questContract.parse(JSON.parse(String(contents)));
    },

    getWorktreeAddSpawns: (): readonly unknown[] =>
      spawnCaptureCalls
        .filter((call) => call.args[0] === 'worktree' && call.args[1] === 'add')
        .map((call) => call.args),

    getTypecheckSpawns: (): readonly unknown[] =>
      spawnStreamCalls.map((call) => ({ args: call.args, cwd: call.cwd })),

    getRiftcarverLogWrites: (): readonly { path: unknown; contents: unknown }[] =>
      [...files.entries()]
        .filter(([path]) => String(path).includes('/riftcarver-results/'))
        .map(([path, contents]) => ({ path, contents })),
  };
};
