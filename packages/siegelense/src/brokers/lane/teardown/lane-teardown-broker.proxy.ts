import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
import { processKillGroupAdapterProxy } from '../../../adapters/process/kill-group/process-kill-group-adapter.proxy';

// Every proxy above mocks its builtin off the BARE specifier — `'process'`, `'fs'` — which is what
// lets two proxies that touch one module compose instead of overwriting each other. The repo's
// proxy-mock transformer keys its dedup on the specifier STRING, so a `node:`-prefixed import of
// the same module becomes a second, competing partial `jest.mock` factory and one of the two
// silently loses to the real syscall. `no-restricted-imports` holds the rule for this package.
// The `kill` and `closeSync` imports below are read-only: they cast the already-mocked functions
// to `jest.MockedFunction` to read `.mock.invocationCallOrder`, and never register a mock.
import { fsCloseFdAdapterProxy } from '../../../adapters/fs/close-fd/fs-close-fd-adapter.proxy';
import { closeSync } from 'fs';
import { kill } from 'process';
import { driverStatics } from '../../../statics/driver/driver-statics';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import type { FileDescriptorStub } from '../../../contracts/file-descriptor/file-descriptor.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;
type FileDescriptor = ReturnType<typeof FileDescriptorStub>;

// The evidence-link resolution a lane's evidencePath must resolve through for
// locationsRepoLinkPathFindBroker to answer a repo-local RepoLocalPath. Fixed rather than
// parameterized: the underlying broker builds its answer with `homePath.replace(rootPath, linkPath)`,
// so a test's `session.evidencePath` has to sit under this exact `rootPath` for the mapping to mean
// anything — these two getters are what a test reads to build a LaneSessionStub that matches.
const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
});
const REPO_LOCAL_EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/guilds/g1/instances/inst_1',
});

export const laneTeardownBrokerProxy = (): {
  getEvidencePath: () => AbsoluteFilePath;
  getExpectedRepoLocalEvidencePath: () => AbsoluteFilePath;
  setupLiveGroup: (params: { pgid: ProcessGroupId }) => void;
  setupAlreadyGoneGroup: (params: { pgid: ProcessGroupId }) => void;
  setupGroupThatExitsDuringGrace: (params: { pgid: ProcessGroupId }) => void;
  setupGraceElapsesInstantly: () => void;
  setupHomeRemoved: (params: { homePath: AbsoluteFilePath }) => void;
  setupEvidenceResolved: () => void;
  getKillCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
  getRemovedPaths: () => unknown[];
  setupFdCloseSucceeds: (params: { fd: FileDescriptor }) => void;
  setupFdCloseFails: (params: { fd: FileDescriptor; error: Error }) => void;
  getClosedFds: () => unknown[];
  assertFdCloseHappensAfterKillSignals: () => boolean;
} => {
  const evidenceProxy = locationsRepoLinkPathFindBrokerProxy();
  const rmProxy = fsRmAdapterProxy();
  const aliveProxy = processIsAliveAdapterProxy();
  const killProxy = processKillGroupAdapterProxy();
  const closeFdProxy = fsCloseFdAdapterProxy();
  const dateNowHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    getEvidencePath: (): AbsoluteFilePath => EVIDENCE_PATH,
    getExpectedRepoLocalEvidencePath: (): AbsoluteFilePath => REPO_LOCAL_EVIDENCE_PATH,

    setupLiveGroup: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
      killProxy.setupSent({ pgid, signal: 'SIGKILL' });
    },

    setupAlreadyGoneGroup: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },

    // `setupLiveGroup`/`setupAlreadyGoneGroup` stage ONE constant answer for the whole test, so
    // neither can tell "checked once" from "checked twice". This stages the liveness PROBE
    // (`kill(-pgid, 0)`) to answer `true` on its first call and ESRCH on its second — the SIGTERM
    // pass sees it alive, the grace window is where it "exits", and a second liveness check right
    // before SIGKILL must see it gone. `onceFor` records are consumed in registration order (first
    // staged, first consumed — `mock-staged-best-match-transformer.ts`'s header), so the first real
    // probe call gets `true` and the second gets the ESRCH throw. SIGKILL is deliberately NOT staged
    // for this pgid: a broker that still sends it hits an unstaged `kill(-pgid, 'SIGKILL')` call,
    // which throws loudly instead of silently succeeding.
    setupGroupThatExitsDuringGrace: ({ pgid }: { pgid: ProcessGroupId }): void => {
      const killHandle: MockHandle = registerMock({ fn: kill });
      killHandle.onceFor([-Number(pgid), 0]).implement(() => true);
      killHandle.onceFor([-Number(pgid), 0]).implement(() => {
        const error = new Error('kill ESRCH') as NodeJS.ErrnoException;
        error.code = 'ESRCH';
        throw error;
      });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
    },

    // Stages Date.now() for the two reads the broker takes bracketing its own SIGTERM loop, the
    // second far enough past the first that `remainingGraceMs` computes to zero — the wait still
    // runs, as a real `setTimeout(resolve, 0)`, but never for the real `driverStatics.teardown.graceMs`.
    setupGraceElapsesInstantly: (): void => {
      dateNowHandle.onceFor([]).returns(0);
      dateNowHandle.onceFor([]).returns(driverStatics.teardown.graceMs);
    },

    setupHomeRemoved: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      rmProxy.succeeds({ dirPath: homePath });
    },

    setupEvidenceResolved: (): void => {
      evidenceProxy.setupLinkResolvesToRoot({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.siegelense' }),
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
      });
    },

    // `processIsAliveAdapterProxy` and `processKillGroupAdapterProxy` both mock `process.kill`, so
    // this pgid's liveness PROBE (signal `0`, from `processIsAliveAdapter`) lands in the same call
    // list `killProxy.getCallsFor` reads — filtering to strings keeps this a read of the SIGNALS
    // actually sent, not the probe that decided whether to send them.
    getKillCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      killProxy.getCallsFor({ pgid }).filter((signal) => typeof signal === 'string'),

    getRemovedPaths: (): unknown[] => rmProxy.getRemovedPaths(),

    setupFdCloseSucceeds: ({ fd }: { fd: FileDescriptor }): void => {
      closeFdProxy.succeeds({ fd });
    },

    setupFdCloseFails: ({ fd, error }: { fd: FileDescriptor; error: Error }): void => {
      closeFdProxy.throws({ fd, error });
    },

    getClosedFds: (): unknown[] => closeFdProxy.getClosedFds(),

    // `kill` and `closeSync` are two different mocked functions, so ordering them needs the raw
    // `invocationCallOrder` Jest stamps on each mock call — MockHandle's own `callsMatching` only
    // orders calls WITHIN one function. Filtering to `typeof signal === 'string'` excludes
    // `processIsAliveAdapter`'s liveness probe (signal `0`), matching `getKillCallsFor` above, so
    // this reads the SIGTERM/SIGKILL signals only, not the probe that precedes them.
    assertFdCloseHappensAfterKillSignals: (): boolean => {
      const killFn = kill as jest.MockedFunction<typeof kill>;
      const closeFn = closeSync as jest.MockedFunction<typeof closeSync>;

      const signalOrders = killFn.mock.calls
        .map((call, index) =>
          typeof call[1] === 'string' ? killFn.mock.invocationCallOrder[index] : undefined,
        )
        .filter((order): order is NonNullable<typeof order> => order !== undefined);
      const closeOrders = closeFn.mock.invocationCallOrder;

      if (signalOrders.length === 0 || closeOrders.length === 0) {
        return false;
      }

      return Math.min(...closeOrders) > Math.max(...signalOrders);
    },
  };
};
