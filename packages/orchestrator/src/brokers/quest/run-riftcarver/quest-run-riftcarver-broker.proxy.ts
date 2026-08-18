/**
 * PURPOSE: Proxy for questRunRiftcarverBroker — mocks ONLY the child-process and fs adapter
 *   boundaries and backs them with a virtual quest-file store plus a virtual git/worktree world, so
 *   every broker between them (worktreePrepareBroker, worktreePopulateNodeModulesBroker,
 *   buildUntilGreenBroker, questModifyBroker, questOperationsUpdateBroker, questAdvanceBroker,
 *   questBlockOnFailureBroker) runs REAL. That is what lets an idempotency test assert the ABSENCE
 *   of a git spawn or a symlink rather than the absence of a call to a stub.
 *
 * USAGE:
 * const proxy = questRunRiftcarverBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.setupBuildFails({ lines: ['error TS2304'] });
 * await questRunRiftcarverBroker({ questId, workItemId, onLine: () => undefined });
 * expect(proxy.getWorktreeAddSpawns()).toStrictEqual([]);
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
  locationsWorktreePathFindBrokerProxy,
  pathJoinAdapterProxy,
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
  type QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { DungeonmasterConfigStub } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
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
import { buildUntilGreenBrokerProxy } from '../../build/until-green/build-until-green-broker.proxy';
import { gitDetectBaseBranchBrokerProxy } from '../../git/detect-base-branch/git-detect-base-branch-broker.proxy';
import { riftcarverPersistResultBrokerProxy } from '../../riftcarver/persist-result/riftcarver-persist-result-broker.proxy';
import { worktreePopulateNodeModulesBrokerProxy } from '../../worktree/populate-node-modules/worktree-populate-node-modules-broker.proxy';
import { worktreePrepareBrokerProxy } from '../../worktree/prepare/worktree-prepare-broker.proxy';
import { questAdvanceBrokerProxy } from '../advance/quest-advance-broker.proxy';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';
import { questRepoRootBrokerProxy } from '../repo-root/quest-repo-root-broker.proxy';

// Module-level mocks (hoisted as jest.mock by the AST transformer). Adapter-level mocking is
// deliberate: routing is registry-global, so the virtual stores below serve EVERY broker in the
// chain regardless of which async tick a call lands on. The two shared barrels use EXPLICIT
// factories (a factory wins the transformer's mock merge) so unrelated registerMock calls collected
// from the shared testing barrel cannot downgrade these to selective mocks.
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
registerModuleMock({
  module: '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter',
});

type QuestInput = ReturnType<typeof QuestStub>;
type WorkItemId = ReturnType<typeof QuestWorkItemIdStub>;
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
const UUID_SUFFIX_WIDTH = 2;

const GIT_SUCCESS = 0;
const GIT_FAILURE = 128;
const BUILD_FAILURE = 1;

const buildDirent = ({ name, isDir, isSymlink }: DirEntry): Dirent =>
  Object.assign(Object.create(Dirent.prototype) as Dirent, {
    name: String(name),
    isDirectory: (): boolean => isDir,
    isFile: (): boolean => !isDir && !isSymlink,
    isSymbolicLink: (): boolean => isSymlink,
  });

export const questRunRiftcarverBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  setupNoBaseBranch: () => void;
  setupBaseBranchMasterOnly: () => void;
  setupBranchExistsInGit: () => void;
  setupWorktreeDirectoryOccupied: () => void;
  setupConfiguredBuildCommand: (params: { buildCommand: string }) => void;
  setupWorktreeAddFails: (params: { output: string }) => void;
  setupWorktreeAddPermissionDenied: () => void;
  setupExistingWorktree: () => void;
  setupWorktreeNodeModulesAlreadyPopulated: () => void;
  setupAlreadyPushed: () => void;
  setupPushFails: (params: { output: string }) => void;
  setupNodeModulesMirrorFails: (params: { error: Error }) => void;
  setupBuildFails: (params: { lines: readonly string[] }) => void;
  getPersistedQuest: () => Quest;
  getWorktreeAddSpawns: () => readonly unknown[];
  getWorktreePruneSpawns: () => readonly unknown[];
  getHeadShaSpawns: () => readonly unknown[];
  getBranchCollisionProbes: () => readonly unknown[];
  getSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
  getBuildSpawns: () => readonly unknown[];
  getRiftcarverLogWrites: () => readonly { path: unknown; contents: unknown }[];
  getPersistedWorkItemStatusesInWriteOrder: (params: {
    workItemId: WorkItemId;
  }) => readonly unknown[];
} => {
  // Child proxies for every adapter/broker the implementation imports. Their own npm-level staging
  // is inert here — the fs/child-process ADAPTER modules are automocked above with the virtual-store
  // implementations below. Two are load-bearing: questModifyBrokerProxy re-applies the REAL
  // questModifyBroker over its module automock, and questBlockOnFailureBrokerProxy is switched to
  // passthrough so a blocked route exercises the real block flow.
  pathJoinAdapterProxy();
  locationsWorktreePathFindBrokerProxy();
  dungeonmasterConfigResolveAdapterProxy();
  fsIsAccessibleAdapterProxy();
  gitCurrentBranchAdapterProxy();
  gitHeadShaAdapterProxy();
  // The push step and its `@{upstream}` done-check. Created for enforce-proxy-child-creation and
  // for their own internal mocks; this proxy answers `spawn` directly, so neither is staged here.
  gitPushAdapterProxy();
  gitUpstreamShaAdapterProxy();
  gitVerifyRefAdapterProxy();
  buildUntilGreenBrokerProxy();
  gitDetectBaseBranchBrokerProxy();
  riftcarverPersistResultBrokerProxy();
  worktreePopulateNodeModulesBrokerProxy();
  worktreePrepareBrokerProxy();
  questAdvanceBrokerProxy();
  questFindQuestPathBrokerProxy();
  questGetBrokerProxy();
  questModifyBrokerProxy();
  questOperationsUpdateBrokerProxy();
  const blockProxy = questBlockOnFailureBrokerProxy();
  blockProxy.setupPassthrough();
  // Created LAST of the quest-broker children on purpose: questModifyBrokerProxy stages this same
  // module at the same `[]` address, and the later registration is the one that answers.
  const repoRootProxy = questRepoRootBrokerProxy();
  repoRootProxy.setupRepoRoot({ repoRoot: REPO_ROOT as never });

  // Virtual filesystem: quest.json and the riftcarver log live here. Persist writes land in the
  // store, so the next broker's load reads the MUTATED quest — read-follows-write, like disk.
  const files = new Map<FilePath, FileContents>();
  const dirEntries = new Map<FilePath, DirEntry[]>();
  const accessiblePaths = new Set<FilePath>();
  const readlinkTargets = new Map<FilePath, FilePath>();
  const mkdirPaths: unknown[] = [];
  const symlinkCalls: { target: unknown; linkPath: unknown }[] = [];
  const spawnCaptureCalls: SpawnRecord[] = [];
  const spawnStreamCalls: SpawnRecord[] = [];
  const questWrites: FileContents[] = [];
  const questFilePathRef = { value: filePathContract.parse('/unset/quest.json') };

  // The virtual git world. `existingRefs` answers `git rev-parse --verify`; `worktreeBranches`
  // answers `git rev-parse --abbrev-ref HEAD` for a path. Together with `accessiblePaths`, those two
  // are what make "this directory is a LIVE worktree of this branch" a real, two-part disk question
  // rather than a single flag.
  const existingRefs = new Set<FileName>([fileNameContract.parse('main')]);
  const worktreeBranches = new Map<FilePath, FileName>();
  const worktreeAddOutcome: { exitCode: ExitCode; output: ErrorMessage } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    output: errorMessageContract.parse(''),
  };
  // A fresh carve starts with the branch tracking NOTHING, which is what makes the push step run.
  // `setupAlreadyPushed` flips it to model a `pt N` re-entry, where the done-check must skip.
  const upstreamSha: { value: ErrorMessage | null } = { value: null };
  const pushOutcome: { exitCode: ExitCode; output: ErrorMessage } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    output: errorMessageContract.parse(''),
  };
  const nodeModulesError: { value: Error | null } = { value: null };
  const buildOutcome: { exitCode: ExitCode; lines: readonly ErrorMessage[] } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    lines: [errorMessageContract.parse('Build succeeded')],
  };

  // Every implementation below is staged with `calledWith([])`: each is a generic simulator that
  // reads the REAL argument it was invoked with out of the shared stores above, exactly like the
  // filesystem or git would. There is only ever ONE behaviour per function; the discrimination
  // happens inside each implementation, not in the staged address.
  // Real `path.join`, not a '/'-join: the node_modules mirror derives a workspace package's root by
  // joining a RELATIVE symlink target ('../../packages/shared') onto the scope directory, and only a
  // normalising join collapses those segments into the path the next root pass has to address.
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
    // Keep EVERY quest persist, not just the last: an intermediate status the final state has
    // already moved past (the in_progress stamp before the carve) is invisible in `files`, which
    // holds only the newest contents per path. The atomic persist writes `quest.json.tmp` and then
    // renames, so both spellings count — and the riftcarver log, which is not JSON at all, must not.
    const writtenPath = String(filePath);
    if (writtenPath.endsWith('quest.json') || writtenPath.endsWith('quest.json.tmp')) {
      questWrites.push(fileContentsContract.parse(String(contents)));
    }
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
  const fsMkdirImpl = async ({
    filepath,
  }: Parameters<typeof fsMkdirAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    mkdirPaths.push(String(filepath));
    const failure = nodeModulesError.value;
    // Scoped to node_modules paths on purpose: the riftcarver-results directory is created through
    // this same adapter AFTER the carve failed, and a blanket rejection would swallow the log write
    // the failure route exists to produce.
    if (failure !== null && String(filepath).includes('/node_modules')) {
      return Promise.reject(failure);
    }
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsMkdirHandle.calledWith([]).implement(fsMkdirImpl as never);

  // The carve reaches git for four distinct invocations, every one of them spawning bare `git`, so
  // the router below dispatches on `args` — the only thing that tells them apart.
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

    // The push step's done-check. A branch tracking nothing is git's own non-zero answer, and that
    // is what a first carve looks like.
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
        // `-b <branch> <base>` on a create, bare `<branch>` on an attach — the branch the new
        // directory ends up on is read off whichever shape arrived, so a later
        // `rev-parse --abbrev-ref HEAD` answers correctly for both.
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
    // Replay the staged output through the caller's callback exactly as the real adapter does, so a
    // test can assert the build's lines actually reach `onLine` instead of only its exit code.
    for (const line of buildOutcome.lines) {
      onLine(String(line));
    }
    return Promise.resolve({
      exitCode: buildOutcome.exitCode,
      output: errorMessageContract.parse(buildOutcome.lines.join('\n')),
    });
  };
  spawnStreamHandle.calledWith([]).implement(spawnStreamImpl as never);

  // No config file on disk is the default: ConfigNotFoundError is the legitimate "no override"
  // state, so the build runs the config contract's own default command (`npm run build`).
  const configHandle = registerMock({ fn: dungeonmasterConfigResolveAdapter });
  const configImpl = async (): Promise<never> =>
    Promise.reject(
      Object.assign(new Error('No .dungeonmaster.json found'), { name: 'ConfigNotFoundError' }),
    );
  configHandle.calledWith([]).implement(configImpl as never);

  // Pin crypto.randomUUID + Date.prototype.toISOString so persisted ids and timestamps are
  // deterministic. Call #0 is always the riftcarverResultId; every later call (spiritmender op id,
  // fresh-carve op id, advance's new work-item id) gets the next sequenced UUID.
  const uuidCounter = { value: 0 };
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const uuidImpl = (): ReturnType<typeof crypto.randomUUID> => {
    const index = uuidCounter.value;
    uuidCounter.value += 1;
    const value =
      index === 0
        ? FIXED_RIFTCARVER_RESULT_UUID
        : `f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0${String(index).padStart(UUID_SUFFIX_WIDTH, '0')}`;
    return value as ReturnType<typeof crypto.randomUUID>;
  };
  uuidSpy.calledWith([]).implement(uuidImpl as never);
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

      // The repo's own node_modules layout: one scope directory holding one relative workspace link,
      // and that workspace package's own node_modules holding one third-party entry. A full mirror
      // therefore makes exactly two symlinks, one per root — which is what makes a per-root skip
      // observable as a count rather than only as a line of text.
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

    // `main` is gone and `master` is the repo's base — the second candidate
    // gitDetectBaseBranchBroker probes, and the one every later merge targets.
    setupBaseBranchMasterOnly: (): void => {
      existingRefs.clear();
      existingRefs.add(fileNameContract.parse('master'));
    },

    // The quest's branch resolves in git RIGHT NOW. Two situations produce that same fact and the
    // tests read it from both sides: on a FIRST carve it means other work owns the name (the
    // collision check refuses), and on a re-carve it means the previous attempt's branch is still
    // there (worktreePrepareBroker attaches to it instead of minting a second one).
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

    // A worktree the previous attempt already carved: the directory is reachable AND git reports the
    // quest's own branch checked out there. Both halves are required — that pair IS the done-check
    // a pt N riftcarver skips on.
    setupExistingWorktree: (): void => {
      accessiblePaths.add(filePathContract.parse(WORKTREE_PATH));
      worktreeBranches.set(
        filePathContract.parse(WORKTREE_PATH),
        fileNameContract.parse(BRANCH_NAME),
      );
      existingRefs.add(fileNameContract.parse(BRANCH_NAME));
    },

    // The OTHER half of the collision check: the worktree directory is already occupied while the
    // branch name is still free. Deliberately does NOT touch `existingRefs` or `worktreeBranches` —
    // that is what makes this the one scenario only `fsIsAccessibleAdapter` can refuse.
    setupWorktreeDirectoryOccupied: (): void => {
      accessiblePaths.add(filePathContract.parse(WORKTREE_PATH));
    },

    // A `.dungeonmaster.json` that declares its own build command, rather than the absent-config
    // default the constructor stages.
    setupConfiguredBuildCommand: ({ buildCommand }: { buildCommand: string }): void => {
      configHandle.calledWith([]).resolves(
        DungeonmasterConfigStub({
          devServer: { devCommand: 'npm run dev', port: 3738, buildCommand },
        }),
      );
    },

    setupWorktreeNodeModulesAlreadyPopulated: (): void => {
      accessiblePaths.add(filePathContract.parse(`${WORKTREE_PATH}/node_modules`));
      dirEntries.set(filePathContract.parse(`${WORKTREE_PATH}/node_modules`), [
        { name: fileNameContract.parse('@dungeonmaster'), isDir: true, isSymlink: false },
      ]);
    },

    setupNodeModulesMirrorFails: ({ error }: { error: Error }): void => {
      nodeModulesError.value = error;
    },

    // A `pt N` re-entry: the first attempt already pushed, so the branch tracks something and the
    // push step must SKIP rather than push again.
    setupAlreadyPushed: (): void => {
      upstreamSha.value = errorMessageContract.parse(HEAD_SHA);
    },

    setupPushFails: ({ output }: { output: string }): void => {
      pushOutcome.exitCode = exitCodeContract.parse(GIT_FAILURE);
      pushOutcome.output = errorMessageContract.parse(output);
    },

    setupBuildFails: ({ lines }: { lines: readonly string[] }): void => {
      buildOutcome.exitCode = exitCodeContract.parse(BUILD_FAILURE);
      buildOutcome.lines = lines.map((line) => errorMessageContract.parse(line));
    },

    getPersistedQuest: (): Quest => {
      const contents = files.get(questFilePathRef.value);
      if (contents === undefined) {
        throw new Error('questRunRiftcarverBrokerProxy: no quest file persisted');
      }
      return questContract.parse(JSON.parse(String(contents)));
    },

    getWorktreeAddSpawns: (): readonly unknown[] =>
      spawnCaptureCalls
        .filter((call) => call.args[0] === 'worktree' && call.args[1] === 'add')
        .map((call) => call.args),

    getWorktreePruneSpawns: (): readonly unknown[] =>
      spawnCaptureCalls
        .filter((call) => call.args[0] === 'worktree' && call.args[1] === 'prune')
        .map((call) => call.args),

    getHeadShaSpawns: (): readonly unknown[] =>
      spawnCaptureCalls
        .filter((call) => call.args[0] === 'rev-parse' && call.args[1] === 'HEAD')
        .map((call) => call.args),

    // Every `rev-parse --verify <questBranch>` the run made: the first carve's collision check AND
    // worktreePrepareBroker's own create-vs-attach mode probe. An empty list therefore proves the
    // pt N skipped creation outright rather than merely choosing a different mode.
    getBranchCollisionProbes: (): readonly unknown[] =>
      spawnCaptureCalls
        .filter(
          (call) =>
            call.args[0] === 'rev-parse' &&
            call.args[1] === '--verify' &&
            call.args[2] === BRANCH_NAME,
        )
        .map((call) => call.args),

    getSymlinks: (): readonly { target: unknown; linkPath: unknown }[] => [...symlinkCalls],

    getBuildSpawns: (): readonly unknown[] =>
      spawnStreamCalls.map((call) => ({ command: call.command, args: call.args, cwd: call.cwd })),

    getRiftcarverLogWrites: (): readonly { path: unknown; contents: unknown }[] =>
      [...files.entries()]
        .filter(([path]) => String(path).includes('/riftcarver-results/'))
        .map(([path, contents]) => ({ path, contents })),

    // One entry per quest-file write that touched this work item, in write order, deduped so
    // unrelated persists do not pad the sequence.
    getPersistedWorkItemStatusesInWriteOrder: ({
      workItemId,
    }: {
      workItemId: WorkItemId;
    }): readonly unknown[] => {
      const statuses = questWrites
        .map((contents) => {
          const parsed = questContract.safeParse(JSON.parse(String(contents)));
          if (!parsed.success) {
            return undefined;
          }
          return parsed.data.workItems.find((item) => item.id === workItemId)?.status;
        })
        .filter((status) => status !== undefined);

      return statuses.filter((status, index) => status !== statuses[index - 1]);
    },
  };
};
