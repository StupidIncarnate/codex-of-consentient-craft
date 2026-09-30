import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { instanceReleaseBrokerProxy } from '../release/instance-release-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { driverSocketRequestBrokerProxy } from '../../driver/socket-request/driver-socket-request-broker.proxy';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';
import { processKillGroupBrokerProxy } from '../../process/kill-group/process-kill-group-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { shutdownReasonWriteBrokerProxy } from '../../shutdown-reason/write/shutdown-reason-write-broker.proxy';
import { driverStatics } from '../../../statics/driver/driver-statics';

type Registry = ReturnType<typeof RegistryStub>;
type ProcessGroupId = number;

// Same convention as instance-start-broker.proxy.ts: every path here is REAL `path.join` output
// off a sticky os.tmpdir() override, resolved through `#gateway/node/path`'s own `join` mock's
// sticky real-passthrough default — never a one-shot stage, which a shared queue across unrelated
// resolvers cannot guarantee. The home itself is staged through dungeonmasterHomeFindBrokerProxy
// (an addressed homedir()/join() pair), not a sticky override.
const HOME_DIR_VALUE = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster`;
const HOME_PATH = HOME_PATH_VALUE;
const ROOT_PATH = `${HOME_PATH_VALUE}/siegelense`;
const TMP_DIR_VALUE = '/tmp';
const CWD_PATH_VALUE = '/default/cwd';
const LINK_PATH_VALUE = `${CWD_PATH_VALUE}/.dungeonmaster-assets/siegelense-assets`;
const LINK_PATH_FILE = LINK_PATH_VALUE;

export const instanceKillBrokerProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupDriverStops: (params: {
    socketPath: string;
    killed?: readonly ProcessGroupId[];
  }) => void;
  setupDriverStopsWithMalformedPayload: (params: {
    socketPath: string;
  }) => void;
  setupDriverUnreachableReapsLivePgids: (params: {
    socketPath: string;
    pgids: readonly ProcessGroupId[];
    homePath: string;
  }) => void;
  setupDriverUnreachableNoPgids: (params: {
    socketPath: string;
    homePath: string;
  }) => void;
  setupDriverUnreachableSomeAlreadyGone: (params: {
    socketPath: string;
    livePgids: readonly ProcessGroupId[];
    alreadyGonePgids: readonly ProcessGroupId[];
    homePath: string;
  }) => void;
  setupShutdownReasonWriteSucceeds: (params: {
    evidencePath: string;
  }) => void;
  getWrittenShutdownReason: (params: {
    evidencePath: string;
  }) => unknown;
  getRemovedPaths: () => unknown[];
  getKillGroupCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
  getReleasedRegistry: () => unknown;
  getConnectionCountFor: (params: {
    socketPath: string;
  }) => number;
} => {
  const registryProxy = registryReadBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  // Captured (not composed bare) so its own setupHomeOnly can stage the addressed home without
  // also staging the link check itself, which this file stages independently (existsSync/realpath/
  // cwd, below) — enforce-proxy-child-creation forbids reaching past this DIRECT child straight to
  // dungeonmasterHomeFindBrokerProxy, since instance-kill-broker.ts never imports it directly.
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  // Unconditional: locationsRepoLinkPathFindBroker calls cwd() on every invocation, before the
  // link check this file stages independently below (existsSync/realpath).
  repoLinkProxy.setupCwd({ cwdPath: CWD_PATH_VALUE });
  locationsSocketPathFindBrokerProxy();
  const releaseProxy = instanceReleaseBrokerProxy();
  const shutdownReasonProxy = shutdownReasonWriteBrokerProxy();
  const socketProxy = driverSocketRequestBrokerProxy();
  const removeProxy = rmProxy();
  const killGroupProxy = processKillGroupBrokerProxy();
  const isAliveProxy = processIsAliveBrokerProxy();
  // #gateway/node/os is a raw passthrough of the Node 'os' module (no per-function wrapper, so no
  // gateway proxy to compose); `tmpdir` takes no argument, so the empty address is the honest one.
  const tmpdirHandle: MockHandle = registerMock({ fn: tmpdir });
  // Read-back addresses only the homes this test staged.
  const stagedHomePaths: unknown[] = [];
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports. The one join this broker makes (the throwaway home) needs no substitution
  // to compute its real value, so only the sticky real-passthrough default is installed.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  stderrProxy();
  // The SIGTERM-then-check-SIGKILL escalation always waits driverStatics.teardown.graceMs (3s)
  // before probing aliveness. Addressed on the delay specifically — an unaddressed stage would ALSO
  // catch unixSocketRequest's own request-timeout setTimeout, firing it immediately and rejecting
  // every socket call before its mocked 'connect'/'data' events (scheduled via process.nextTick)
  // ever get a turn.
  const timeoutProxy = setTimeoutProxy();
  timeoutProxy.setupFiresImmediately({ ms: driverStatics.teardown.graceMs });
  tmpdirHandle.calledWith([]).returns(TMP_DIR_VALUE);

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      // dungeonmasterHomeFindBroker checks DUNGEONMASTER_HOME before falling back to
      // homedir() — staged here (a returned method, not the constructor, since
      // enforce-proxy-patterns confines constructor bodies to child-proxy creation and handle
      // staging) so every root-path resolution this test drives resolves against HOME_PATH_VALUE
      // rather than whatever jest's own global setup or the real OS homedir would produce.
      const json = JSON.stringify(registry);
      registryProxy.setupPresentRegistry({ content: json });
      repoLinkProxy.setupLinkResolvesToRoot({
        cwdPath: CWD_PATH_VALUE,
        linkPath: LINK_PATH_FILE,
        homeDir: HOME_DIR_VALUE,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      releaseProxy.setupCurrentRegistry({ json });
    },

    // The response payload is a real JSON-encoded KillResult, matching what `laneTeardownBroker`'s
    // own return actually looks like once the driver processes a `kill` request for real — `killed`
    // defaults to `[]` (nothing the driver's teardown SIGTERM'd/SIGKILL'd), matching a headless or
    // already-quiet lane.
    setupDriverStops: ({
      socketPath,
      killed,
    }: {
      socketPath: string;
      killed?: readonly ProcessGroupId[];
    }): void => {
      socketProxy.respondsWith({
        socketPath,
        response: DriverResponseStub({
          ok: true,
          payload: JSON.stringify(
            KillResultStub({ reapedPgids: [], killed: killed === undefined ? [] : [...killed] }),
          ),
        }),
      });
    },

    // A payload that fails `killResultContract.parse` — this instance's own driver answered but
    // never carries any `killed`/pgid information a caller can trust, so the kill still succeeds and
    // reports nothing stopped rather than throwing over a shape mismatch.
    setupDriverStopsWithMalformedPayload: ({
      socketPath,
    }: {
      socketPath: string;
    }): void => {
      socketProxy.respondsWith({
        socketPath,
        response: DriverResponseStub({ ok: true, payload: 'not json' }),
      });
    },

    // The registry row (staged via setupRegistry, `entry.pgids`) names the candidates — never a
    // separate heartbeat file, which this broker no longer reads at all. Every named pgid answers
    // ALIVE at both the pre-SIGTERM and pre-SIGKILL checks, so both signals reach it.
    setupDriverUnreachableReapsLivePgids: ({
      socketPath,
      pgids,
      homePath,
    }: {
      socketPath: string;
      pgids: readonly ProcessGroupId[];
      homePath: string;
    }): void => {
      socketProxy.connectFailsRefused({ socketPath });
      pgids.forEach((pgid) => {
        isAliveProxy.setupAlive({ pgid });
        killGroupProxy.setupSent({ pgid, signal: 'SIGTERM' });
        killGroupProxy.setupSent({ pgid, signal: 'SIGKILL' });
      });
      stagedHomePaths.push(homePath);
      removeProxy.succeeds({ path: homePath });
    },

    // A mix: some of the registry row's recorded pgids answer gone at the very first probe (a prior
    // kill already stopped them, or the OS reclaimed the group on its own) and are never signalled at
    // all; the rest answer alive throughout and get the full SIGTERM/SIGKILL escalation.
    setupDriverUnreachableSomeAlreadyGone: ({
      socketPath,
      livePgids,
      alreadyGonePgids,
      homePath,
    }: {
      socketPath: string;
      livePgids: readonly ProcessGroupId[];
      alreadyGonePgids: readonly ProcessGroupId[];
      homePath: string;
    }): void => {
      socketProxy.connectFailsRefused({ socketPath });
      alreadyGonePgids.forEach((pgid) => {
        isAliveProxy.setupGone({ pgid });
      });
      livePgids.forEach((pgid) => {
        isAliveProxy.setupAlive({ pgid });
        killGroupProxy.setupSent({ pgid, signal: 'SIGTERM' });
        killGroupProxy.setupSent({ pgid, signal: 'SIGKILL' });
      });
      stagedHomePaths.push(homePath);
      removeProxy.succeeds({ path: homePath });
    },

    // The registry row names no pgids at all (a fresh reservation, or one already cleared by a
    // prior release) — nothing to probe, nothing to signal.
    setupDriverUnreachableNoPgids: ({
      socketPath,
      homePath,
    }: {
      socketPath: string;
      homePath: string;
    }): void => {
      socketProxy.connectFailsRefused({ socketPath });
      stagedHomePaths.push(homePath);
      removeProxy.succeeds({ path: homePath });
    },

    // Delegates to shutdownReasonWriteBrokerProxy's own `writeFile` mock — the SAME shared mock
    // `writeHandle` above already answers for the registry's own writes, addressed here by the
    // shutdown-reason path instead. `nowMs` matches this proxy's own `Date.now` stub so re-staging
    // it through `setupWriteSucceeds` is a no-op collision, not a silent override.
    setupShutdownReasonWriteSucceeds: ({
      evidencePath,
    }: {
      evidencePath: string;
    }): void => {
      shutdownReasonProxy.setupWriteSucceeds({ evidencePath, nowMs: 1 });
    },

    getWrittenShutdownReason: ({
      evidencePath,
    }: {
      evidencePath: string;
    }): unknown => {
      const written = shutdownReasonProxy.getWrittenMarkerContent({ evidencePath });
      return typeof written === 'string' ? JSON.parse(written) : null;
    },

    getRemovedPaths: (): unknown[] =>
      removeProxy
        .getCallsFor({
          path: (value: unknown): boolean => stagedHomePaths.some((path) => path === value),
        })
        .map((call) => call[0]),

    getKillGroupCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      killGroupProxy.getCallsFor({ pgid }),

    getReleasedRegistry: (): unknown => {
      const written = releaseProxy.getWrittenRegistry();
      return written;
    },

    getConnectionCountFor: ({
      socketPath,
    }: {
      socketPath: string;
    }): number => socketProxy.getConnectionCountFor({ socketPath }),
  };
};
