// PURPOSE: Proxy for lane-boot-broker — stages every boundary it composes (cwd resolution, mkdir,
// path joining, process spawn, log fds, process kill, home removal, the browser launch, and
// readiness) behind semantic setup methods, so a test never chains through a child proxy directly.
// USAGE: const proxy = laneBootBrokerProxy(); const repoRoot = proxy.resolveRepoRoot();
//        proxy.setupProcessBoot({ logPath, fd, command: 'npm', args: [...], pid: 1001 });

import { chromium } from '@playwright/test';
import {
  cwdResolveBrokerProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnDetachedAdapterProxy } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.proxy';
import { fsCloseFdAdapterProxy } from '../../../adapters/fs/close-fd/fs-close-fd-adapter.proxy';
import { fsOpenFdAdapterProxy } from '../../../adapters/fs/open-fd/fs-open-fd-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { playwrightSessionAdapterProxy } from '../../../adapters/playwright/session/playwright-session-adapter.proxy';
import { processKillGroupAdapterProxy } from '../../../adapters/process/kill-group/process-kill-group-adapter.proxy';
import { laneReadyWaitBrokerProxy } from '../ready-wait/lane-ready-wait-broker.proxy';
import { serverLogReaderLayerBrokerProxy } from './server-log-reader-layer-broker.proxy';
import { fakeAgentCliStatics } from '../../../statics/fake-agent-cli/fake-agent-cli-statics';
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
  setupAgentCliFixturesFound: (params: { repoRoot: AbsoluteFilePath }) => void;
  setupAgentCliFixturesNotFound: (params: { repoRoot: AbsoluteFilePath }) => void;
  setupAgentCliFixtureFound: (params: { filePath: AbsoluteFilePath }) => void;
  setupAgentCliFixtureNotFound: (params: { filePath: AbsoluteFilePath }) => void;
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
  const spawnProxy = childProcessSpawnDetachedAdapterProxy();
  const openFdProxy = fsOpenFdAdapterProxy();
  const closeFdProxy = fsCloseFdAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const killProxy = processKillGroupAdapterProxy();
  playwrightSessionAdapterProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();
  serverLogReaderLayerBrokerProxy();

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
      spawnProxy.succeeds({ command, args: [...args], pid });
      // A boot-failure path SIGKILLs and closes every group it spawned, regardless of which
      // process(es) triggered the failure — every booted process needs its kill/close pre-staged,
      // not just the ones a given test expects to fail.
      killProxy.setupSent({ pgid: ProcessGroupIdStub({ value: pid }), signal: 'SIGKILL' });
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

    // The failure path removes ONLY this home — never evidencePath, which fsRmAdapterProxy is never
    // staged for, so an accidental rm(evidencePath) call throws "nothing set up" instead of quietly
    // succeeding.
    setupHomeRemoved: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      rmProxy.succeeds({ dirPath: homePath });
    },

    setupAgentCliFixturesFound: ({ repoRoot }: { repoRoot: AbsoluteFilePath }): void => {
      fakeAgentCliStatics.requiredEnvVars.forEach(({ fixtureRelativePath }) => {
        const fixturePath = absoluteFilePathContract.parse(`${repoRoot}/${fixtureRelativePath}`);
        statProxy.resolves({ filePath: fixturePath, sizeBytes: 100, modifiedAtMs: 1_000 });
      });
    },

    setupAgentCliFixturesNotFound: ({ repoRoot }: { repoRoot: AbsoluteFilePath }): void => {
      fakeAgentCliStatics.requiredEnvVars.forEach(({ fixtureRelativePath }) => {
        const fixturePath = absoluteFilePathContract.parse(`${repoRoot}/${fixtureRelativePath}`);
        statProxy.rejects({
          filePath: fixturePath,
          error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
        });
      });
    },

    setupAgentCliFixtureFound: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.resolves({ filePath, sizeBytes: 100, modifiedAtMs: 1_000 });
    },

    setupAgentCliFixtureNotFound: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.rejects({
        filePath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
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
