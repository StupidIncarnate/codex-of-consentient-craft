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

import { spawn, type ChildProcess } from 'child_process';
import { Dirent } from 'fs';
import { mkdir } from 'fs/promises';
import { EventEmitter, Readable } from 'stream';

import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { existsSync, readdirEntriesSync } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { fsMkdirAdapter, fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { locationsWorktreePathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  absoluteFilePathContract,
  adapterResultContract,
  baseBranchNameContract,
  errorMessageContract,
  exitCodeContract,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  questBranchNameContract,
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
import { currentBranchProxy } from '#gateway/bin/git/current-branch/current-branch.proxy';
import { headShaProxy } from '#gateway/bin/git/head-sha/head-sha.proxy';
import { pushProxy } from '#gateway/bin/git/push/push.proxy';
import { upstreamShaProxy } from '#gateway/bin/git/upstream-sha/upstream-sha.proxy';
import { verifyRefProxy } from '#gateway/bin/git/verify-ref/verify-ref.proxy';
import { wardCommandStatics } from '../../../statics/ward-command/ward-command-statics';
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
    fsMkdirAdapter: jest.fn(),
    fsReaddirWithTypesAdapter: jest.fn(),
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
// Matches stepHandlerRiftcarverBroker's own typecheck spawn — `wardCommandStatics.bin`, the same
// command name `step-handler-ward-broker.proxy.ts` stages on the shared `streamLines`/`spawn` mock.
// Staging stays deferred to `setupQuest`/`setupTypecheckFails` (never unconditional at
// construction) so an inert composition of this proxy — `stepHandlerRunBrokerProxy` builds one
// purely to satisfy `enforce-proxy-child-creation` — never registers an address the ward handler
// proxy's own staging could collide with.
const TYPECHECK_COMMAND = wardCommandStatics.bin;

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
  const typecheckSpawn = streamLinesProxy();
  locationsWorktreePathFindBrokerProxy();
  fsIsAccessibleAdapterProxy();
  const gitCurrentBranchProxy = currentBranchProxy();
  const gitHeadShaProxy = headShaProxy();
  const gitPushProxy = pushProxy();
  const gitUpstreamProxy = upstreamShaProxy();
  const gitVerifyProxy = verifyRefProxy();
  gitDetectBaseBranchBrokerProxy();
  riftcarverPersistResultBrokerProxy();
  const prepareProxy = worktreePrepareBrokerProxy();
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
  const questFilePathRef = { value: filePathContract.parse('/unset/quest.json') };

  const existingRefs = new Set<FileName>([fileNameContract.parse('main')]);
  // Whether the quest's own branch already resolves in git: decides whether the carve is a create
  // (`-b`) or an attach, and both are staged from this one flag.
  const questBranch: { exists: boolean; addFailureOutput: ErrorMessage | null } = {
    exists: false,
    addFailureOutput: null,
  };
  const typecheckOutcome: { exitCode: ExitCode; lines: readonly ErrorMessage[] } = {
    exitCode: exitCodeContract.parse(GIT_SUCCESS),
    lines: [errorMessageContract.parse('✓ typecheck')],
  };

  // `pathJoinAdapter` (still called for real by `questOperationsUpdateBroker`, not yet migrated)
  // needs no mock of its own here: it is left OUT of the `@dungeonmaster/shared/adapters` module
  // mock's override list above, so `jest.requireActual` spreads in the real, unmocked function — a
  // pure wrapper over Node's own `path.join`, identical in effect to the real-passthrough this file
  // used to build by hand.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });

  // questFindQuestPathBroker and questGetBroker reach `readdirEntriesSync`/`existsSync` through the
  // gateway directly, not through `@dungeonmaster/shared/adapters` — and so, now, do the node_modules
  // mirror brokers (populateOneRootLayerBroker, worktreeSeedDistBroker), which used to reach them
  // through the shared `fsReaddirWithTypesAdapter` this file still mocks below for whatever in this
  // chain has not moved yet. Mocked at the WRAPPER rather than through `#gateway/node/fs`'s dedicated
  // `readdir-entries-sync.proxy` / `exists-sync.proxy`: those compose only for a proxy whose OWN
  // implementation imports the gateway name directly, and `enforce-proxy-child-creation` refuses them
  // here, where the implementation is `step-handler-riftcarver-broker.ts`.
  //
  // `existsSync` defaults to the REAL WRAPPER implementation, not a fabricated value: this proxy is
  // composed downstream (via stepHandlerRunBrokerProxy) alongside other brokers that ALSO reach
  // questFindQuestPathBroker, for OTHER quests, staged through ITS OWN `existsSyncProxy` — which mocks
  // raw `fs`, one layer below this wrapper. Mocking this wrapper with no default would swallow every
  // one of those calls before they ever reach the raw-fs mock that answers them; real-passthrough lets
  // an unstaged call fall through to the wrapper's own body, which still calls the (separately mocked)
  // raw fs underneath. `readdirEntriesSync` has no such sibling to fall through to, so it is backed by
  // the `dirEntries` virtual store directly (below), same as the shared adapter's own implementation.
  const realGatewayFs = requireActual<{
    existsSync: typeof existsSync;
  }>({ module: '#gateway/node/fs' });
  // The node_modules-mirror brokers (populateOneRootLayerBroker, worktreeSeedDistBroker) now call
  // `readdirEntriesSync` from `#gateway/node/fs` directly rather than the shared
  // `fsReaddirWithTypesAdapter`, so this virtual world backs it with the SAME `dirEntries` store —
  // never a real disk read, which would ENOENT on every one of this test's fake paths.
  const gatewayReaddirHandle = registerMock({ fn: readdirEntriesSync });
  const gatewayReaddirImpl = (dirPath: string): DirEntrySync[] =>
    (dirEntries.get(filePathContract.parse(dirPath)) ?? []).map((entry) => ({
      name: String(entry.name),
      kind: entry.isSymlink ? 'symlink' : entry.isDir ? 'directory' : 'file',
    }));
  gatewayReaddirHandle.calledWith([]).implement(gatewayReaddirImpl as never);
  const gatewayExistsHandle = registerMock({ fn: existsSync });
  gatewayExistsHandle.calledWith([]).implement(realGatewayFs.existsSync as never);
  // `join` is pure with nothing to virtualize — real passthrough by default, same as
  // pathJoinAdapter's own above, since `#gateway/node/path`'s `join` is the identical function.
  const gatewayJoinHandle = registerMock({ fn: join });
  gatewayJoinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  // The same brokers now call `ensureDir` (`#gateway/node/fs__promises`) rather than the shared
  // `fsMkdirAdapter`. Mocked at `mkdir` itself (`fs/promises`), one level BELOW `ensureDir` —
  // never at `ensureDir` directly, and never through the gateway's own `ensureDirProxy()` either:
  // `enforce-proxy-child-creation` refuses that composition HERE, because this file's own
  // `step-handler-riftcarver-broker.ts` never imports `ensureDir` itself (only
  // `populateOneRootLayerBroker`, several calls down the chain, does — confirmed by running lint:
  // "Proxy creates ensureDirProxy but step-handler-riftcarver-broker.ts does not import ensureDir").
  // `ensureDir`'s own body is real logic (`mkdir(path, {recursive:true})`) that the GATEWAY's own
  // `ensureDirProxy()` (composed by sibling proxies — riftcarverPersistResultBrokerProxy,
  // populateOneRootLayerBrokerProxy, ward's own proxy — when this proxy is combined with theirs)
  // depends on running for real, with `mkdir` mocked beneath it. A `registerMock({fn: ensureDir})`
  // here replaces `ensureDir`'s implementation FOR THE WHOLE TEST FILE and starves every sibling
  // proxy's own `mkdir`-level staging of ever running (confirmed: ward's own
  // `ensureDirProxy().succeeds(...)` stage for its ward-results directory went unanswered once this
  // mocked `ensureDir` instead). Staged per-quest below, once `setupQuest` knows the real
  // questFolderPath and the real node_modules-mirror targets, on the exact directories those
  // brokers compute — never an address-less default.
  const mkdirHandle = registerMock({ fn: mkdir });
  // populateOneRootLayerBroker hardlinks third-party node_modules entries by calling the gateway's
  // `run` for `cp`, which reaches raw `child_process.spawn` directly — never through the
  // (module-mocked) `childProcessSpawnCaptureAdapter` `spawnCaptureImpl` below answers every git
  // command by. Mocked at `spawn` itself (raw `child_process`, matching `run.proxy.ts`'s own
  // convention), one level BELOW `run` — never at `run` directly, and never through the gateway's
  // own `runProxy()` either, for the identical `enforce-proxy-child-creation` reason as `mkdir`
  // above: this file's own `step-handler-riftcarver-broker.ts` never imports `run` (confirmed by
  // running lint: "Proxy creates runProxy but step-handler-riftcarver-broker.ts does not import
  // run"). `run`'s own body is real, substantial logic (event wiring, stream draining) that OTHER
  // real brokers in this chain depend on running for real, and its wrapper folder shares one
  // gateway barrel (`#gateway/node/child_process`) with `streamLines` — the production import this
  // file's own broker.ts makes. `registerMock({fn: run})` here replaces `run`'s implementation FOR
  // THE WHOLE TEST FILE and starves `wardDetailBroker`'s own real call to `run` (confirmed: threw
  // "nothing set up for this call" once tried, when combined with ward's own proxy via
  // `stepHandlerRunBrokerProxy`). Importing `spawn` from the GATEWAY barrel instead of raw
  // `child_process` was ALSO tried and confirmed broken: it corrupted this file's OWN `streamLines`
  // import (the two share that one barrel), driving this file's own typecheck spawn into the same
  // "nothing set up" failure. Raw `child_process` is the only working import for `spawn` here —
  // see this item's "Trap" entry in a12-adapters-shared.md for the full account. Addressed by the
  // command alone: this virtual world has no real files for `cp` to hardlink and no test here reads
  // its argv back.
  const COPY_COMMAND = 'cp';
  const spawnHandle = registerMock({ fn: spawn });
  const createCpChild = (): ChildProcess => {
    const child = new EventEmitter() as ChildProcess;
    child.stdout = new Readable({
      read(): void {
        /* noop */
      },
    });
    child.stderr = new Readable({
      read(): void {
        /* noop */
      },
    });
    setImmediate(() => {
      child.stdout?.push(null);
      child.stderr?.push(null);
      child.emit('exit', 0, null);
    });
    return child;
  };
  spawnHandle.calledWith([COPY_COMMAND]).implement(createCpChild as never);

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

  // The virtual git world is staged through the gateway's own proxies, by the exact argv each call
  // sends. A ref probe answers from `existingRefs` at call time; the carve itself (probe, prune,
  // add, head sha) is staged by `worktreePrepareBrokerProxy`, the one proxy that owns those calls.
  gitVerifyProxy.returnsMatchingRef({
    ref: (ref: unknown): boolean => existingRefs.has(fileNameContract.parse(String(ref))),
    exitCode: GIT_SUCCESS,
  });
  gitVerifyProxy.returnsMatchingRef({
    ref: (ref: unknown): boolean => !existingRefs.has(fileNameContract.parse(String(ref))),
    exitCode: GIT_FAILURE,
  });
  const stageUpstream = ({ tracked }: { tracked: boolean }): void => {
    gitUpstreamProxy.setupResult(
      tracked
        ? { exitCode: GIT_SUCCESS, output: `${HEAD_SHA}\n` }
        : { exitCode: GIT_FAILURE, output: 'fatal: no upstream configured' },
    );
  };
  stageUpstream({ tracked: false });
  const stagePush = ({ exitCode, output }: { exitCode: number; output: string }): void => {
    gitPushProxy.setupUpstreamPush({ branchName: BRANCH_NAME, exitCode, output });
  };
  stagePush({ exitCode: GIT_SUCCESS, output: '' });
  const stageCarve = (): void => {
    const worktreePath = absoluteFilePathContract.parse(WORKTREE_PATH);
    const branchName = questBranchNameContract.parse(BRANCH_NAME);
    const baseBranch = baseBranchNameContract.parse('main');
    if (questBranch.addFailureOutput !== null) {
      prepareProxy.setupWorktreeAddFails({
        worktreePath,
        branchName,
        baseBranch,
        output: String(questBranch.addFailureOutput),
      });
      return;
    }
    if (questBranch.exists) {
      prepareProxy.setupAttachExistingBranch({ worktreePath, branchName, sha: HEAD_SHA });
      return;
    }
    prepareProxy.setupHappyPath({ worktreePath, branchName, baseBranch, sha: HEAD_SHA });
  };
  const worktreeWasAdded = (): boolean =>
    questBranch.addFailureOutput === null &&
    prepareProxy
      .getSpawnedArgsList()
      .some((args) => Array.isArray(args) && args[0] === 'worktree' && args[1] === 'add');

  // A worktree the carve just added is reachable from then on, the way a real `git worktree add`
  // leaves it.
  const fsIsAccessibleHandle = registerMock({ fn: fsIsAccessibleAdapter });
  const fsIsAccessibleImpl = async ({
    filePath,
  }: Parameters<typeof fsIsAccessibleAdapter>[0]): Promise<boolean> => {
    const path = filePathContract.parse(String(filePath));
    return Promise.resolve(
      accessiblePaths.has(path) || (String(path) === WORKTREE_PATH && worktreeWasAdded()),
    );
  };
  fsIsAccessibleHandle.calledWith([]).implement(fsIsAccessibleImpl as never);

  // The typecheck spawn is staged per-quest inside `setupQuest`/`setupTypecheckFails` below, once
  // `typecheckOutcome` holds the scenario's real values — never staged here with a placeholder, so
  // there is no moment where an unaddressed default could answer a call this proxy never described.
  const stageTypecheckSpawn = (): void => {
    typecheckSpawn.setupSuccess({
      command: TYPECHECK_COMMAND,
      exitCode: Number(typecheckOutcome.exitCode),
      stdoutLines: typecheckOutcome.lines.map((line) => String(line)),
    });
  };

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

      // riftcarverPersistResultBroker's own ensureDir call, addressed on the exact directory it
      // computes (questPath + riftcarverResultsDir) — never an address-less catch-all.
      const questFolderPath = `${QUESTS_DIR}/${String(quest.folder)}`;
      const riftcarverResultsDir = filePathContract.parse(
        `${questFolderPath}/${locationsStatics.quest.riftcarverResultsDir}`,
      );
      mkdirHandle.calledWith([riftcarverResultsDir]).resolves(undefined);

      // questFindQuestPathBroker's own guild listing and per-guild quest scan, addressed by the
      // exact known directories this store's one guild holds — never an address-less catch-all.
      gatewayReaddirHandle
        .calledWith([GUILDS_DIR])
        .returns([{ name: GUILD_ID, kind: 'directory' }]);
      gatewayReaddirHandle
        .calledWith([QUESTS_DIR])
        .returns([{ name: String(quest.folder), kind: 'directory' }]);
      // The probe's own join keys its last segment on `questId`, not `folder` — this store only
      // ever holds the quest under its FOLDER name, so the probe's exact candidate path is
      // addressed as an explicit miss and the real broker falls through to the scan above, which
      // does hold it.
      gatewayExistsHandle
        .calledWith([`${QUESTS_DIR}/${String(quest.id)}/quest.json`])
        .returns(false);

      dirEntries.set(filePathContract.parse(`${REPO_ROOT}/node_modules`), [
        { name: fileNameContract.parse('@dungeonmaster'), isDir: true, isSymlink: false },
      ]);
      dirEntries.set(filePathContract.parse(`${REPO_ROOT}/node_modules/@dungeonmaster`), [
        { name: fileNameContract.parse(WORKSPACE_PACKAGE), isDir: false, isSymlink: true },
      ]);
      // populateOneRootLayerBroker's own ensureDir calls for the node_modules mirror — the
      // worktree's root node_modules, the @dungeonmaster scope dir beneath it, and the workspace
      // package's own node_modules — each addressed on the exact target this test's fixed
      // WORKTREE_PATH and WORKSPACE_PACKAGE compute, never an address-less catch-all.
      mkdirHandle.calledWith([`${WORKTREE_PATH}/node_modules`]).resolves(undefined);
      mkdirHandle.calledWith([`${WORKTREE_PATH}/node_modules/@dungeonmaster`]).resolves(undefined);
      mkdirHandle
        .calledWith([`${WORKTREE_PATH}/packages/${WORKSPACE_PACKAGE}/node_modules`])
        .resolves(undefined);
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

      stageTypecheckSpawn();
      stageCarve();
      gitCurrentBranchProxy.setupFailure({ exitCode: 128, output: 'fatal: not a git repository' });
      gitHeadShaProxy.setupResult({ exitCode: 0, output: `${HEAD_SHA}\n` });
    },

    setupNoBaseBranch: (): void => {
      existingRefs.clear();
    },

    setupBranchExistsInGit: (): void => {
      existingRefs.add(fileNameContract.parse(BRANCH_NAME));
      questBranch.exists = true;
      stageCarve();
    },

    setupWorktreeAddFails: ({ output }: { output: string }): void => {
      questBranch.addFailureOutput = errorMessageContract.parse(output);
      stageCarve();
    },

    setupWorktreeAddPermissionDenied: (): void => {
      questBranch.addFailureOutput = errorMessageContract.parse(
        `fatal: cannot mkdir ${WORKTREE_PATH}: Permission denied`,
      );
      stageCarve();
    },

    setupExistingWorktree: (): void => {
      accessiblePaths.add(filePathContract.parse(WORKTREE_PATH));
      existingRefs.add(fileNameContract.parse(BRANCH_NAME));
      questBranch.exists = true;
      stageCarve();
      gitCurrentBranchProxy.setupBranch({ branch: BRANCH_NAME });
    },

    setupAlreadyPushed: (): void => {
      stageUpstream({ tracked: true });
    },

    setupPushFails: ({ output }: { output: string }): void => {
      stagePush({ exitCode: GIT_FAILURE, output });
    },

    setupTypecheckFails: ({ lines }: { lines: readonly string[] }): void => {
      typecheckOutcome.exitCode = exitCodeContract.parse(TYPECHECK_FAILURE);
      typecheckOutcome.lines = lines.map((line) => errorMessageContract.parse(line));
      // Re-stages the same address `setupQuest` already staged — the later registration wins (see
      // `mockStagedBestMatchTransformer`), so this overrides the green default without needing a
      // fresh proxy or a second construction.
      stageTypecheckSpawn();
    },

    getPersistedQuest: (): Quest => {
      const contents = files.get(questFilePathRef.value);
      if (contents === undefined) {
        throw new Error('stepHandlerRiftcarverBrokerProxy: no quest file persisted');
      }
      return questContract.parse(JSON.parse(String(contents)));
    },

    getWorktreeAddSpawns: (): readonly unknown[] =>
      prepareProxy
        .getSpawnedArgsList()
        .filter((args) => Array.isArray(args) && args[0] === 'worktree' && args[1] === 'add'),

    getTypecheckSpawns: (): readonly unknown[] => {
      const args = typecheckSpawn.getSpawnedArgs({ command: TYPECHECK_COMMAND });
      return typecheckSpawn
        .getOptionsFor({ command: TYPECHECK_COMMAND })
        .map((options) => ({ args, cwd: options.cwd }));
    },

    getRiftcarverLogWrites: (): readonly { path: unknown; contents: unknown }[] =>
      [...files.entries()]
        .filter(([path]) => String(path).includes('/riftcarver-results/'))
        .map(([path, contents]) => ({ path, contents })),
  };
};
