// PURPOSE: Proxy for lane-boot-broker — stages every boundary it composes (mkdir,
// path joining, process spawn, log fds, process kill, home removal, the browser launch, readiness,
// and a restart's stop, respawn and registry stamp) behind semantic setup methods, so a test never
// chains through a child proxy directly.
// USAGE: const proxy = laneBootBrokerProxy(); const { repoRoot } = proxy;
//        proxy.setupProcessBoot({ logPath, fd, command: 'npm', args: [...], pid: 1001 });

import { join } from '#gateway/node/path';
import { envSnapshot } from '#gateway/node/process';
import { closeSyncProxy } from '#gateway/node/fs/close-sync/close-sync.proxy';
import { openForAppendSyncProxy } from '#gateway/node/fs/open-for-append-sync/open-for-append-sync.proxy';
import { envSnapshotProxy } from '#gateway/node/process/env-snapshot/env-snapshot.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { processKillGroupBrokerProxy } from '../../process/kill-group/process-kill-group-broker.proxy';
import { browserSessionLaunchBrokerProxy } from '../../browser-session/launch/browser-session-launch-broker.proxy';
import { laneWorkspaceResolveBrokerProxy } from '../workspace-resolve/lane-workspace-resolve-broker.proxy';
import { processesRestartLayerBrokerProxy } from './processes-restart-layer-broker.proxy';
import { processesSpawnLayerBrokerProxy } from './processes-spawn-layer-broker.proxy';
import { processesStopLayerBrokerProxy } from './processes-stop-layer-broker.proxy';
import { serverLogReaderLayerBrokerProxy } from './server-log-reader-layer-broker.proxy';

type ProcessGroupId = number;
type ReadingCount = number;

// The repo root a test hands the broker unless a scenario names another one. A spawn is staged by
// its cwd, so a boot that spawned anywhere else finds no staged answer and throws.
const REPO_ROOT_VALUE = '/default/repo-root';

// This proxy's whole test file boots exactly `HOME_PATH`/`EVIDENCE_PATH` (never a runtime-computed
// pair), so the only two directories `laneBootBroker` ever `ensureDir`s are staged once,
// unconditionally, rather than per scenario — mirroring `boot-lock-acquire-broker.proxy.ts`'s
// identical fixed-rootPath staging.
const HOME_PATH_VALUE = '/tmp/dm-siege-inst_7f3a9c21';
const EVIDENCE_PATH_VALUE =
  '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21';

export const laneBootBrokerProxy = (): {
  repoRoot: string;
  setupProcessBoot: (params: {
    logPath: string;
    fd: number;
    command: string;
    args: readonly string[];
    pid: number;
    repoRoot?: string;
  }) => void;
  setupServerReachable: (params: { url: string }) => void;
  setupServerNeverReachable: (params: { url: string }) => void;
  setupBootDeadlineAlreadyPast: () => void;
  // Restages the spawn of a command the boot already staged, so a `startProcesses` respawn gets a
  // new pid; call it after the boot, the later staging winning.
  setupRespawn: (params: { command: string; args: readonly string[]; pid: number }) => void;
  setupGroupExitsOnSigterm: (params: { pgid: ProcessGroupId }) => void;
  setupRegistry: (params: { json: string }) => void;
  getWrittenRegistry: () => unknown;
  setupHomeRemoved: (params: { homePath: string }) => void;
  // Stages laneWorkspaceResolveBroker's two fs boundaries so a spec referencing `{apiWorkspace}`
  // and/or `{webWorkspace}` resolves to a real name instead of throwing "no mock configured" — see
  // that broker's own proxy for why this stages the packages/ listing ONCE with every dir name a
  // test needs, rather than once per workspace kind.
  setupWorkspacesResolved: (params: {
    repoRoot: string;
    apiPackageName?: string;
    webPackageName?: string;
  }) => void;
  getSpawnOptionsFor: (params: {
    command: string;
    args: readonly string[];
    repoRoot?: string;
  }) => unknown;
  getKillSignalsFor: (params: { pgid: ProcessGroupId }) => readonly unknown[];
  getClosedFds: () => readonly unknown[];
  getRemovedHomePaths: () => readonly unknown[];
  getBrowserLaunchCallCount: () => ReadingCount;
  // The env a spawned process's stdio inherits, captured at the SAME point `lane-boot-broker`
  // itself reads `process.env` — a test reading process.env only after `await`ing the whole boot
  // would also pick up browserSessionLaunchBroker's own later PLAYWRIGHT_BROWSERS_PATH mutation.
  getInheritedEnvSnapshot: () => Record<PropertyKey, string>;
} => {
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
  // envSnapshotProxy is inert, composed to satisfy enforce-proxy-child-creation.
  envSnapshotProxy();
  const spawnProxy = processesSpawnLayerBrokerProxy();
  const stopProxy = processesStopLayerBrokerProxy();
  const restartProxy = processesRestartLayerBrokerProxy();
  const openFdProxy = openForAppendSyncProxy();
  const closeFdProxy = closeSyncProxy();
  const removeProxy = rmProxy();
  const killProxy = processKillGroupBrokerProxy();
  // Read-back addresses only the paths and fds this test staged; an unstaged call already throws.
  const stagedHomePaths: string[] = [];
  const stagedFds: number[] = [];
  const browserProxy = browserSessionLaunchBrokerProxy();
  const workspaceProxy = laneWorkspaceResolveBrokerProxy();
  serverLogReaderLayerBrokerProxy();

  return {
    repoRoot: REPO_ROOT_VALUE,

    setupProcessBoot: ({
      logPath,
      fd,
      command,
      args,
      pid,
      repoRoot,
    }: {
      logPath: string;
      fd: number;
      command: string;
      args: readonly string[];
      pid: number;
      repoRoot?: string;
    }): void => {
      openFdProxy.returns({ path: logPath, fd });
      spawnProxy.setupSpawn({ command, args, cwd: repoRoot ?? REPO_ROOT_VALUE, pid });
      // A boot-failure path SIGKILLs and closes every group it spawned, regardless of which
      // process(es) triggered the failure — every booted process needs its kill/close pre-staged,
      // not just the ones a given test expects to fail.
      killProxy.setupSent({ pgid: pid, signal: 'SIGKILL' });
      stagedFds.push(fd);
      closeFdProxy.succeeds({ fd });
    },

    setupRespawn: ({
      command,
      args,
      pid,
    }: {
      command: string;
      args: readonly string[];
      pid: number;
    }): void => {
      spawnProxy.setupSpawn({ command, args, cwd: REPO_ROOT_VALUE, pid });
    },

    setupGroupExitsOnSigterm: ({ pgid }: { pgid: ProcessGroupId }): void => {
      stopProxy.setupExitsOnSigterm({ pgid });
    },

    setupRegistry: ({ json }: { json: string }): void => {
      restartProxy.setupRegistry({ json });
    },

    getWrittenRegistry: (): unknown => restartProxy.getWrittenRegistry(),

    setupServerReachable: ({ url }: { url: string }): void => {
      spawnProxy.setupReachable({ url });
    },

    setupServerNeverReachable: ({ url }: { url: string }): void => {
      spawnProxy.setupUnreachable({ url });
    },

    setupBootDeadlineAlreadyPast: (): void => {
      spawnProxy.setupDeadlineAlreadyPast();
    },

    // The failure path removes ONLY this home — never evidencePath, which `rm` is never
    // staged for, so an accidental rm(evidencePath) call throws "nothing set up" instead of quietly
    // succeeding.
    setupHomeRemoved: ({ homePath }: { homePath: string }): void => {
      stagedHomePaths.push(homePath);
      removeProxy.succeeds({ path: homePath });
    },

    setupWorkspacesResolved: ({
      repoRoot,
      apiPackageName,
      webPackageName,
    }: {
      repoRoot: string;
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
          srcDirNames: ['flows'],
          dependencies: { hono: '^4.0.0' },
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
      repoRoot,
    }: {
      command: string;
      args: readonly string[];
      repoRoot?: string;
    }): unknown =>
      spawnProxy.getSpawnOptionsFor({ command, args, cwd: repoRoot ?? REPO_ROOT_VALUE }).at(-1),

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

    getBrowserLaunchCallCount: (): ReadingCount => browserProxy.getLaunchCalls().length,

    getInheritedEnvSnapshot: (): Record<string, string> =>
      Object.fromEntries(
        Object.entries(envSnapshot()).flatMap(([key, value]): [string, string][] =>
          value === undefined ? [] : [[key, value]],
        ),
      ),
  };
};
