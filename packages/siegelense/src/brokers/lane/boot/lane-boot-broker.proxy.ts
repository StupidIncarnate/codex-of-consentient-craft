// PURPOSE: Proxy for lane-boot-broker — stages every boundary it composes (cwd resolution, mkdir,
// path joining, process spawn, log fds, process kill, home removal, the browser launch, and
// readiness) behind semantic setup methods, so a test never chains through a child proxy directly.
// USAGE: const proxy = laneBootBrokerProxy(); const repoRoot = proxy.resolveRepoRoot();
//        proxy.setupProcessBoot({ logPath, fd, command: 'npm', args: [...], pid: 1001 });

import { join } from '#gateway/node/path';
import { cwd } from '#gateway/node/process';
import { closeSyncProxy } from '#gateway/node/fs/close-sync/close-sync.proxy';
import { openForAppendSyncProxy } from '#gateway/node/fs/open-for-append-sync/open-for-append-sync.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnDetachedAdapterProxy } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { processKillGroupBrokerProxy } from '../../process/kill-group/process-kill-group-broker.proxy';
import { browserSessionLaunchBrokerProxy } from '../../browser-session/launch/browser-session-launch-broker.proxy';
import { laneReadyWaitBrokerProxy } from '../ready-wait/lane-ready-wait-broker.proxy';
import { laneWorkspaceResolveBrokerProxy } from '../workspace-resolve/lane-workspace-resolve-broker.proxy';
import { serverLogReaderLayerBrokerProxy } from './server-log-reader-layer-broker.proxy';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { FileDescriptor } from '../../../contracts/file-descriptor/file-descriptor-contract';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;
type ReadingCount = ReturnType<typeof ReadingCountStub>;

// A deadline-exceeded case is staged with two clock readings: the FIRST call answers
// `lane-boot-broker`'s own `Date.now() + spec.bootTimeoutMs` deadline computation, and every call
// after answers `lane-ready-wait-broker`'s post-probe deadline check — comfortably past any
// `bootTimeoutMs` this package's stubs use, so the very first failed probe reports "expired" with
// no real setTimeout wait.
const CLOCK_BASE_MS = 1_700_000_000_000;
const CLOCK_PAST_DEADLINE_MS = 1_710_000_000_000;

// The single cwd value every test in this file resolves against — `resolveRepoRoot()` reads it
// back off the (now mocked) `cwd()` import directly, the same way the broker's own `cwd()` call
// does, so both sides always agree.
const CWD_PATH_VALUE = '/default/cwd';

// This proxy's whole test file boots exactly `HOME_PATH`/`EVIDENCE_PATH` (never a runtime-computed
// pair), so the only two directories `laneBootBroker` ever `ensureDir`s are staged once,
// unconditionally, rather than per scenario — mirroring `boot-lock-acquire-broker.proxy.ts`'s
// identical fixed-rootPath staging.
const HOME_PATH_VALUE = '/tmp/dm-siege-inst_7f3a9c21';
const EVIDENCE_PATH_VALUE =
  '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21';

export const laneBootBrokerProxy = (): {
  resolveRepoRoot: () => AbsoluteFilePath;
  setupProcessBoot: (params: {
    logPath: AbsoluteFilePath;
    fd: FileDescriptor;
    command: string;
    args: readonly string[];
    pid: number;
  }) => void;
  setupServerReachable: (params: { url: string }) => void;
  setupServerNeverReachable: (params: { url: string }) => void;
  setupBootDeadlineAlreadyPast: () => void;
  setupHomeRemoved: (params: { homePath: AbsoluteFilePath }) => void;
  // Stages laneWorkspaceResolveBroker's two fs boundaries so a spec referencing `{apiWorkspace}`
  // and/or `{webWorkspace}` resolves to a real name instead of throwing "no mock configured" — see
  // that broker's own proxy for why this stages the packages/ listing ONCE with every dir name a
  // test needs, rather than once per workspace kind.
  setupWorkspacesResolved: (params: {
    repoRoot: AbsoluteFilePath;
    apiPackageName?: string;
    webPackageName?: string;
  }) => void;
  getSpawnOptionsFor: (params: { command: string; args: readonly string[] }) => unknown;
  getKillSignalsFor: (params: { pgid: ProcessGroupId }) => readonly unknown[];
  getClosedFds: () => readonly unknown[];
  getRemovedHomePaths: () => readonly unknown[];
  getBrowserLaunchCallCount: () => ReadingCount;
  // The env a spawned process's stdio inherits, captured at the SAME point `lane-boot-broker`
  // itself reads `process.env` — a test reading process.env only after `await`ing the whole boot
  // would also pick up browserSessionLaunchBroker's own later PLAYWRIGHT_BROWSERS_PATH mutation.
  getInheritedEnvSnapshot: () => Record<PropertyKey, ContentText>;
} => {
  const resolveProxy = cwdResolveBrokerProxy();
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — every
  // join this broker makes (claudeQueueDir, wardQueueDir, each process's logPath) is already known
  // at test-setup time (HOME_PATH_VALUE/EVIDENCE_PATH_VALUE plus a literal segment), so the real
  // computed path always matches what setupProcessBoot stages on openForAppendSync.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  // `ensureDir` has no catch-all by design — the two directories this broker ever ensureDirs are
  // HOME_PATH_VALUE and EVIDENCE_PATH_VALUE, fixed for every test in this file, so both are staged
  // once, unconditionally, rather than per scenario.
  const mkdirProxy = ensureDirProxy();
  mkdirProxy.succeeds({ path: HOME_PATH_VALUE });
  mkdirProxy.succeeds({ path: EVIDENCE_PATH_VALUE });
  // gateway proxy import — inert, satisfies enforce-proxy-child-creation.
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns(CWD_PATH_VALUE);
  const spawnProxy = childProcessSpawnDetachedAdapterProxy();
  const openFdProxy = openForAppendSyncProxy();
  const closeFdProxy = closeSyncProxy();
  const removeProxy = rmProxy();
  const killProxy = processKillGroupBrokerProxy();
  // Read-back addresses only the paths and fds this test staged; an unstaged call already throws.
  const stagedHomePaths: AbsoluteFilePath[] = [];
  const stagedFds: FileDescriptor[] = [];
  const browserProxy = browserSessionLaunchBrokerProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();
  const workspaceProxy = laneWorkspaceResolveBrokerProxy();
  serverLogReaderLayerBrokerProxy();

  return {
    resolveRepoRoot: (): AbsoluteFilePath => {
      // The `cwd` mock staged above already answers CWD_PATH_VALUE — reading it here (rather than
      // picking a value independently) is what keeps this and the implementation's own `cwd()`
      // call agreeing on the same seed.
      const cwdPath = cwd();
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      return absoluteFilePathContract.parse(cwdPath);
    },

    setupProcessBoot: ({
      logPath,
      fd,
      command,
      args,
      pid,
    }: {
      logPath: AbsoluteFilePath;
      fd: FileDescriptor;
      command: string;
      args: readonly string[];
      pid: number;
    }): void => {
      openFdProxy.returns({ path: logPath, fd });
      spawnProxy.succeeds({ command, args: [...args], pid });
      // A boot-failure path SIGKILLs and closes every group it spawned, regardless of which
      // process(es) triggered the failure — every booted process needs its kill/close pre-staged,
      // not just the ones a given test expects to fail.
      killProxy.setupSent({ pgid: ProcessGroupIdStub({ value: pid }), signal: 'SIGKILL' });
      stagedFds.push(fd);
      closeFdProxy.succeeds({ fd });
    },

    setupServerReachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupReachable({ url });
    },

    setupServerNeverReachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupUnreachable({ url });
    },

    setupBootDeadlineAlreadyPast: (): void => {
      readyWaitProxy.stageDeadlineExceeded({
        firstCallMs: CLOCK_BASE_MS,
        thenMs: CLOCK_PAST_DEADLINE_MS,
      });
    },

    // The failure path removes ONLY this home — never evidencePath, which `rm` is never
    // staged for, so an accidental rm(evidencePath) call throws "nothing set up" instead of quietly
    // succeeding.
    setupHomeRemoved: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      stagedHomePaths.push(homePath);
      removeProxy.succeeds({ path: homePath });
    },

    setupWorkspacesResolved: ({
      repoRoot,
      apiPackageName,
      webPackageName,
    }: {
      repoRoot: AbsoluteFilePath;
      apiPackageName?: string;
      webPackageName?: string;
    }): void => {
      const packageNames = [
        ...(apiPackageName === undefined ? [] : ['api-pkg']),
        ...(webPackageName === undefined ? [] : ['web-pkg']),
      ];
      workspaceProxy.setupPackagesDir({ repoRoot, packageNames });
      if (apiPackageName !== undefined) {
        workspaceProxy.setupPackage({
          repoRoot,
          dirName: 'api-pkg',
          packageName: apiPackageName,
          adapterDirNames: ['hono'],
        });
      }
      if (webPackageName !== undefined) {
        workspaceProxy.setupPackage({
          repoRoot,
          dirName: 'web-pkg',
          packageName: webPackageName,
          srcDirNames: ['widgets'],
          dependencies: { react: '18.2.0' },
        });
      }
    },

    getSpawnOptionsFor: ({
      command,
      args,
    }: {
      command: string;
      args: readonly string[];
    }): unknown => spawnProxy.getOptionsFor({ command, args: [...args] }),

    getKillSignalsFor: ({ pgid }: { pgid: ProcessGroupId }): readonly unknown[] =>
      killProxy.getCallsFor({ pgid }),

    // Every staged descriptor closed, in call order.
    getClosedFds: (): readonly unknown[] =>
      closeFdProxy
        .calls({ fd: (value: unknown): boolean => stagedFds.some((fd) => fd === value) })
        .map((call) => call[0]),

    getRemovedHomePaths: (): readonly unknown[] =>
      removeProxy
        .getCallsFor({
          path: (value: unknown): boolean => stagedHomePaths.some((path) => path === value),
        })
        .map((call) => call[0]),

    getBrowserLaunchCallCount: (): ReadingCount =>
      ReadingCountStub({ value: browserProxy.getLaunchCalls().length }),

    getInheritedEnvSnapshot: (): Record<PropertyKey, ContentText> =>
      Object.fromEntries(
        Object.entries(process.env)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]): [PropertyKey, ContentText] => [
            key,
            contentTextContract.parse(value),
          ]),
      ),
  };
};
