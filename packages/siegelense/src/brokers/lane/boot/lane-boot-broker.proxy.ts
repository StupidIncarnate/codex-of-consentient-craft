// PURPOSE: Proxy for lane-boot-broker — stages every boundary it composes (cwd resolution, mkdir,
// path joining, process spawn, log fds, process kill, home removal, the browser launch, readiness,
// and a restart's stop, respawn and registry stamp) behind semantic setup methods, so a test never chains through a child proxy directly.
// USAGE: const proxy = laneBootBrokerProxy(); const repoRoot = proxy.resolveRepoRoot();
//        proxy.setupProcessBoot({ logPath, fd, command: 'npm', args: [...], pid: 1001 });

import { chromium } from '@playwright/test';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  cwdResolveBrokerProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { fsCloseFdAdapterProxy } from '../../../adapters/fs/close-fd/fs-close-fd-adapter.proxy';
import { fsOpenFdAdapterProxy } from '../../../adapters/fs/open-fd/fs-open-fd-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { playwrightSessionAdapterProxy } from '../../../adapters/playwright/session/playwright-session-adapter.proxy';
import { processKillGroupAdapterProxy } from '../../../adapters/process/kill-group/process-kill-group-adapter.proxy';
import { laneWorkspaceResolveBrokerProxy } from '../workspace-resolve/lane-workspace-resolve-broker.proxy';
import { processesRestartLayerBrokerProxy } from './processes-restart-layer-broker.proxy';
import { processesSpawnLayerBrokerProxy } from './processes-spawn-layer-broker.proxy';
import { processesStopLayerBrokerProxy } from './processes-stop-layer-broker.proxy';
import { serverLogReaderLayerBrokerProxy } from './server-log-reader-layer-broker.proxy';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { FileDescriptor } from '../../../contracts/file-descriptor/file-descriptor-contract';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;
type ReadingCount = ReturnType<typeof ReadingCountStub>;

// The clock every scenario reads by default. The registry proxies behind the restart layer spy on
// `Date.now` with no answer of their own, so an unstaged read would throw; a boot that probes a
// reachable server reads it once, for its deadline, and needs no particular value.
// `setupBootDeadlineAlreadyPast` stages its own sequence on top, and the later staging wins.
const CLOCK_BASE_MS = 1_700_000_000_000;

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
  // A boot followed by a `startProcesses` respawn of the same command: the boot gets `bootPid`, the
  // respawn `restartPid`.
  setupProcessBootThenRestart: (params: {
    logPath: AbsoluteFilePath;
    fd: FileDescriptor;
    command: string;
    args: readonly string[];
    bootPid: number;
    restartPid: number;
  }) => void;
  setupGroupExitsOnSigterm: (params: { pgid: ProcessGroupId }) => void;
  setupRegistry: (params: { json: string }) => void;
  getWrittenRegistry: () => unknown;
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
  // would also pick up playwrightSessionAdapter's own later PLAYWRIGHT_BROWSERS_PATH mutation.
  getInheritedEnvSnapshot: () => Record<PropertyKey, ContentText>;
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  // Constructed for its own default "any path succeeds" / real-passthrough behavior — see each
  // adapter's own proxy — and only to satisfy enforce-proxy-child-creation, never addressed further.
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  processCwdAdapterProxy();
  const openFdProxy = fsOpenFdAdapterProxy();
  const closeFdProxy = fsCloseFdAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const killProxy = processKillGroupAdapterProxy();
  playwrightSessionAdapterProxy();
  const workspaceProxy = laneWorkspaceResolveBrokerProxy();
  serverLogReaderLayerBrokerProxy();
  const spawnProxy = processesSpawnLayerBrokerProxy();
  const stopProxy = processesStopLayerBrokerProxy();
  const restartProxy = processesRestartLayerBrokerProxy();
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(CLOCK_BASE_MS);

  return {
    resolveRepoRoot: (): AbsoluteFilePath => {
      // processCwdAdapterProxy() above already mocked process.cwd() to its own sticky default —
      // reading it here (rather than picking a value independently) is what keeps this and the
      // implementation's own processCwdAdapter() call agreeing on the same seed.
      const cwdPath = processCwdAdapter();
      cwdProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
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
      openFdProxy.returns({ filePath: logPath, fd });
      spawnProxy.setupSpawn({ command, args, pid });
      // A boot-failure path SIGKILLs and closes every group it spawned, regardless of which
      // process(es) triggered the failure — every booted process needs its kill/close pre-staged,
      // not just the ones a given test expects to fail.
      killProxy.setupSent({ pgid: ProcessGroupIdStub({ value: pid }), signal: 'SIGKILL' });
      closeFdProxy.succeeds({ fd });
    },

    setupProcessBootThenRestart: ({
      logPath,
      fd,
      command,
      args,
      bootPid,
      restartPid,
    }: {
      logPath: AbsoluteFilePath;
      fd: FileDescriptor;
      command: string;
      args: readonly string[];
      bootPid: number;
      restartPid: number;
    }): void => {
      openFdProxy.returns({ filePath: logPath, fd });
      spawnProxy.setupSpawnOnce({ command, args, pid: bootPid });
      spawnProxy.setupSpawnOnce({ command, args, pid: restartPid });
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

    // The failure path removes ONLY this home — never evidencePath, which fsRmAdapterProxy is never
    // staged for, so an accidental rm(evidencePath) call throws "nothing set up" instead of quietly
    // succeeding.
    setupHomeRemoved: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      rmProxy.succeeds({ dirPath: homePath });
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
    }): unknown => spawnProxy.getSpawnOptionsFor({ command, args }),

    getKillSignalsFor: ({ pgid }: { pgid: ProcessGroupId }): readonly unknown[] =>
      killProxy.getCallsFor({ pgid }),

    getClosedFds: (): readonly unknown[] => closeFdProxy.getClosedFds(),

    getRemovedHomePaths: (): readonly unknown[] => rmProxy.getRemovedPaths(),

    getBrowserLaunchCallCount: (): ReadingCount =>
      ReadingCountStub({ value: (chromium.launch as unknown as jest.Mock).mock.calls.length }),

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
