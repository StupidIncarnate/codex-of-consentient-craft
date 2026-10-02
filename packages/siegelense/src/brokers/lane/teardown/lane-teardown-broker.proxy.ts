import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import { closeSyncProxy } from '#gateway/node/fs/close-sync/close-sync.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';
import { processKillGroupBrokerProxy } from '../../process/kill-group/process-kill-group-broker.proxy';
import { driverStatics } from '../../../statics/driver/driver-statics';

type ProcessGroupId = number;
type FileDescriptor = number;

// The evidence-link resolution a lane's evidencePath must resolve through for
// locationsRepoLinkPathFindBroker to answer a repo-local RepoLocalPath. Fixed rather than
// parameterized: the underlying broker builds its answer with `homePath.replace(rootPath, linkPath)`,
// so a test's `session.evidencePath` has to sit under this exact `rootPath` for the mapping to mean
// anything — these two getters are what a test reads to build a LaneSessionStub that matches.
const EVIDENCE_PATH = '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1';
const REPO_ROOT = '/repo';
const REPO_LOCAL_EVIDENCE_PATH =
  '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1';

export const laneTeardownBrokerProxy = (): {
  getEvidencePath: () => string;
  getRepoRoot: () => string;
  getExpectedRepoLocalEvidencePath: () => string;
  setupLiveGroup: (params: { pgid: ProcessGroupId }) => void;
  setupAlreadyGoneGroup: (params: { pgid: ProcessGroupId }) => void;
  setupGroupThatExitsDuringGrace: (params: { pgid: ProcessGroupId }) => void;
  setupGraceElapsesInstantly: () => void;
  setupHomeRemoved: (params: { homePath: string }) => void;
  setupEvidenceResolved: () => void;
  getKillCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
  getRemovedPaths: () => unknown[];
  setupFdCloseSucceeds: (params: { fd: FileDescriptor }) => void;
  setupFdCloseFails: (params: { fd: FileDescriptor; error: NodeJS.ErrnoException }) => void;
  getClosedFds: () => unknown[];
  getStderrWrites: () => readonly unknown[];
  assertFdCloseHappensAfterKillSignals: () => boolean;
} => {
  const evidenceProxy = locationsRepoLinkPathFindBrokerProxy();
  const removeProxy = rmProxy();
  const aliveProxy = processIsAliveBrokerProxy();
  const killProxy = processKillGroupBrokerProxy();
  const closeFdProxy = closeSyncProxy();
  const stderr = stderrProxy();
  setTimeoutProxy();
  const dateNowHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });
  // Read-back addresses only the paths and fds this test staged, so a read never widens to calls
  // the test did not describe (an unstaged call already throws).
  const stagedHomePaths: string[] = [];
  const stagedFds: FileDescriptor[] = [];
  // How many staged fds had been closed at the moment each kill signal landed — every entry must
  // be 0 for the teardown's kill-then-close order to hold.
  const closedCountAtEachSignal: number[] = [];
  const readClosedFds = (): unknown[] =>
    closeFdProxy
      .calls({ fd: (value: unknown): boolean => stagedFds.some((fd) => fd === value) })
      .map((call) => call[0]);
  const recordSignal = (): void => {
    closedCountAtEachSignal.push(readClosedFds().length);
  };

  return {
    getEvidencePath: (): string => EVIDENCE_PATH,
    getRepoRoot: (): string => REPO_ROOT,
    getExpectedRepoLocalEvidencePath: (): string => REPO_LOCAL_EVIDENCE_PATH,

    setupLiveGroup: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM', onSent: recordSignal });
      killProxy.setupSent({ pgid, signal: 'SIGKILL', onSent: recordSignal });
    },

    setupAlreadyGoneGroup: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },

    // `setupLiveGroup`/`setupAlreadyGoneGroup` stage ONE constant answer for the whole test, so
    // neither can tell "checked once" from "checked twice". This stages the liveness PROBE to answer
    // alive on its first call and ESRCH on its second — the SIGTERM pass sees it alive, the grace
    // window is where it "exits", and the second check right before SIGKILL must see it gone.
    // SIGKILL is deliberately NOT staged for this pgid: a broker that still sends it hits an
    // unstaged `kill(-pgid, 'SIGKILL')` call, which throws loudly instead of silently succeeding.
    setupGroupThatExitsDuringGrace: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAliveThenGone({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM', onSent: recordSignal });
    },

    // Stages Date.now() for the two reads the broker takes bracketing its own SIGTERM loop, the
    // second far enough past the first that `remainingGraceMs` computes to zero — the wait still
    // runs, as a real `setTimeout(resolve, 0)`, but never for the real `driverStatics.teardown.graceMs`.
    setupGraceElapsesInstantly: (): void => {
      dateNowHandle.onceFor([]).returns(0);
      dateNowHandle.onceFor([]).returns(driverStatics.teardown.graceMs);
    },

    setupHomeRemoved: ({ homePath }: { homePath: string }): void => {
      stagedHomePaths.push(homePath);
      removeProxy.succeeds({ path: homePath });
    },

    setupEvidenceResolved: (): void => {
      evidenceProxy.setupLinkResolvesToRoot({
        repoRoot: REPO_ROOT,
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        rootPath: '/home/user/.dungeonmaster/siegelense',
      });
    },

    getKillCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      killProxy.getCallsFor({ pgid }),

    getRemovedPaths: (): unknown[] =>
      removeProxy
        .getCallsFor({
          path: (value: unknown): boolean => stagedHomePaths.some((path) => path === value),
        })
        .map((call) => call[0]),

    setupFdCloseSucceeds: ({ fd }: { fd: FileDescriptor }): void => {
      stagedFds.push(fd);
      closeFdProxy.succeeds({ fd });
    },

    setupFdCloseFails: ({
      fd,
      error,
    }: {
      fd: FileDescriptor;
      error: NodeJS.ErrnoException;
    }): void => {
      stagedFds.push(fd);
      closeFdProxy.throws({ fd, error });
    },

    getClosedFds: (): unknown[] => readClosedFds(),

    getStderrWrites: (): readonly unknown[] => stderr.getWrites(),

    assertFdCloseHappensAfterKillSignals: (): boolean =>
      closedCountAtEachSignal.length > 0 &&
      readClosedFds().length > 0 &&
      closedCountAtEachSignal.every((closedCount) => closedCount === 0),
  };
};
