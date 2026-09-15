import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// Import order is load-bearing below: `locationsRepoLinkPathFindBrokerProxy` pulls in
// `@dungeonmaster/shared`'s `processCwdAdapterProxy`, which mocks `process.cwd` off the BARE
// `'process'` specifier. This package's own process adapters (`process-kill-group-adapter.ts`,
// `process-is-alive-adapter.ts`) mock `process.kill` off `'node:process'` — a DIFFERENT specifier
// string that Jest's auto-mock registry resolves to the same underlying built-in, so whichever
// specifier's mock factory is registered LAST wins for the whole module. Importing the two
// process/kill-group and process/is-alive proxies AFTER the locations/fs proxies below is what
// keeps `kill` mocked; reversing this order silently sends SIGTERM/SIGKILL through the REAL
// `process.kill`, which throws ESRCH against every test pgid. See W12's report for the reproduction.
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
import { processKillGroupAdapterProxy } from '../../../adapters/process/kill-group/process-kill-group-adapter.proxy';
import { driverStatics } from '../../../statics/driver/driver-statics';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

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
  setupGraceElapsesInstantly: () => void;
  setupHomeRemoved: (params: { homePath: AbsoluteFilePath }) => void;
  setupEvidenceResolved: () => void;
  getKillCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
  getRemovedPaths: () => unknown[];
} => {
  const evidenceProxy = locationsRepoLinkPathFindBrokerProxy();
  const rmProxy = fsRmAdapterProxy();
  const aliveProxy = processIsAliveAdapterProxy();
  const killProxy = processKillGroupAdapterProxy();
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
  };
};
