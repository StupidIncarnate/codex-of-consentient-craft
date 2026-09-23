import { homedir } from 'os';
import { existsSync } from 'fs';
import { access, readFile, realpath, rename, unlink, writeFile } from 'fs/promises';
import { cwd } from 'process';
import { createConnection } from 'net';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { instanceReleaseBrokerProxy } from '../release/instance-release-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { netUnixRequestAdapterProxy } from '../../../adapters/net/unix-request/net-unix-request-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';
import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
import { processKillGroupAdapterProxy } from '../../../adapters/process/kill-group/process-kill-group-adapter.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import type { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { driverStatics } from '../../../statics/driver/driver-statics';

type Registry = ReturnType<typeof RegistryStub>;
type InstanceHeartbeat = ReturnType<typeof InstanceHeartbeatStub>;
type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

// Same convention as instance-start-broker.proxy.ts: every path here is REAL `path.join` output
// off a sticky os.homedir() / os.tmpdir() / processCwdAdapter() override, never a one-shot
// `pathJoinAdapter.returns()` — see that file's header comment for why a shared one-shot queue
// across unrelated resolvers is unsafe.
const HOME_DIR_VALUE = '/home/user';
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const REGISTRY_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json`;
const REGISTRY_TMP_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json.tmp`;
const REGISTRY_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.lock`;
const REGISTRY_PATH_FILE = FilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_TMP_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_TMP_PATH_VALUE });
const REGISTRY_LOCK_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_LOCK_PATH_VALUE });
const TMP_DIR_VALUE = '/tmp';
const CWD_PATH_VALUE = '/default/cwd';
const CONFIG_FILE_PATH_VALUE = `${CWD_PATH_VALUE}/.dungeonmaster.json`;
const LINK_PATH_VALUE = `${CWD_PATH_VALUE}/.dungeonmaster-assets/siegelense-assets`;
const CONFIG_FILE_PATH = FilePathStub({ value: CONFIG_FILE_PATH_VALUE });
const LINK_PATH_FILE = FilePathStub({ value: LINK_PATH_VALUE });

export const instanceKillBrokerProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupDriverStops: (params: { socketPath: ReturnType<typeof AbsoluteFilePathStub> }) => void;
  setupDriverUnreachable: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    heartbeatPath: ReturnType<typeof AbsoluteFilePathStub>;
    heartbeat: InstanceHeartbeat;
    homePath: ReturnType<typeof AbsoluteFilePathStub>;
  }) => void;
  setupDriverUnreachableNoHeartbeat: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    heartbeatPath: ReturnType<typeof AbsoluteFilePathStub>;
    homePath: ReturnType<typeof AbsoluteFilePathStub>;
  }) => void;
  setupDriverUnreachableHeartbeatReadFails: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    heartbeatPath: ReturnType<typeof AbsoluteFilePathStub>;
  }) => void;
  getRemovedPaths: () => unknown[];
  getKillGroupCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
  getReleasedRegistry: () => unknown;
  getConnectionCountFor: (params: {
    socketPath: ReturnType<typeof AbsoluteFilePathStub>;
  }) => ReturnType<typeof ReadingCountStub>;
} => {
  errorIsNativeErrorAdapterProxy();
  registryReadBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  locationsRepoLinkPathFindBrokerProxy();
  locationsSocketPathFindBrokerProxy();
  const releaseProxy = instanceReleaseBrokerProxy();
  const socketProxy = netUnixRequestAdapterProxy();
  fsReadFileAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const tmpdirProxy = osTmpdirAdapterProxy();
  const killGroupProxy = processKillGroupAdapterProxy();
  const isAliveProxy = processIsAliveAdapterProxy();
  // Not composed as processCwdAdapterProxy/cwdResolveBrokerProxy: this implementation never
  // imports either directly — locationsRepoLinkPathFindBroker uses them transitively, so the
  // underlying node primitives are mocked here instead, same as os.homedir()/os.tmpdir() below.
  pathJoinAdapterProxy();
  const connectionHandle: MockHandle = registerMock({ fn: createConnection });

  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const writeHandle: MockHandle = registerMock({ fn: writeFile });
  const renameHandle: MockHandle = registerMock({ fn: rename });
  const unlinkHandle: MockHandle = registerMock({ fn: unlink });
  const realpathHandle: MockHandle = registerMock({ fn: realpath });
  const accessHandle: MockHandle = registerMock({ fn: access });
  const cwdHandle: MockHandle = registerMock({ fn: cwd });
  registerMock({ fn: homedir }).calledWith([]).returns(HOME_DIR_VALUE);
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(EpochMsStub().valueOf());
  // The SIGTERM-then-check-SIGKILL escalation always waits driverStatics.teardown.graceMs (3s)
  // before probing aliveness. Addressed on the delay specifically (a predicate for the callback,
  // since that reference differs per call) — global and unaddressed would ALSO catch
  // netUnixRequestAdapter's own request-timeout setTimeout, firing it immediately and rejecting
  // every socket call before its mocked 'connect'/'data' events (scheduled via process.nextTick)
  // ever get a turn.
  registerSpyOn({ object: globalThis, method: 'setTimeout', passthrough: true })
    .calledWith([
      (candidate: unknown) => typeof candidate === 'function',
      driverStatics.teardown.graceMs,
    ])
    .implement(((callback: () => void) => {
      callback();
      return 0;
    }) as never);
  tmpdirProxy.returns({ path: TMP_DIR_VALUE });
  cwdHandle.calledWith([]).returns(CWD_PATH_VALUE);
  accessHandle.calledWith([CONFIG_FILE_PATH]).resolves({ success: true as const });

  existsHandle.calledWith([REGISTRY_PATH_FILE]).returns(true);
  existsHandle.calledWith([LINK_PATH_FILE]).returns(true);
  realpathHandle.calledWith([LINK_PATH_FILE]).resolves(ROOT_PATH_VALUE);
  writeHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);
  writeHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);
  renameHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);
  unlinkHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      // dungeonmasterHomeFindBroker checks DUNGEONMASTER_HOME before falling back to
      // os.homedir() — clear it here (a returned method, not this constructor, since this
      // implementation never imports dungeonmasterHomeFindBroker directly and composing its
      // proxy just for clearHomeEnv() would be a phantom creation) so the sticky homedir
      // override above actually governs every root-path resolution; jest's own global setup
      // stamps a real tmp path here, which would otherwise win.
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      readHandle.calledWith([REGISTRY_PATH_ABS]).resolves(JSON.stringify(registry));
    },

    setupDriverStops: ({
      socketPath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    }): void => {
      socketProxy.respondsWith({ socketPath, response: DriverResponseStub({ ok: true }) });
    },

    setupDriverUnreachable: ({
      socketPath,
      heartbeatPath,
      heartbeat,
      homePath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
      heartbeatPath: ReturnType<typeof AbsoluteFilePathStub>;
      heartbeat: InstanceHeartbeat;
      homePath: ReturnType<typeof AbsoluteFilePathStub>;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
      readHandle.calledWith([heartbeatPath]).resolves(JSON.stringify(heartbeat));
      heartbeat.pgids.forEach((pgid) => {
        killGroupProxy.setupSent({ pgid, signal: 'SIGTERM' });
        isAliveProxy.setupGone({ pgid });
      });
      rmProxy.succeeds({ dirPath: homePath });
    },

    setupDriverUnreachableNoHeartbeat: ({
      socketPath,
      heartbeatPath,
      homePath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
      heartbeatPath: ReturnType<typeof AbsoluteFilePathStub>;
      homePath: ReturnType<typeof AbsoluteFilePathStub>;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
      readHandle
        .calledWith([heartbeatPath])
        .rejects(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));
      rmProxy.succeeds({ dirPath: homePath });
    },

    // This instance is itself mid-teardown, so EMFILE (file descriptor exhaustion) is the
    // realistic non-absence code the heartbeat read can fail with. That failure must not be read
    // as "no heartbeat was ever written" and skip straight to reaping nothing.
    setupDriverUnreachableHeartbeatReadFails: ({
      socketPath,
      heartbeatPath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
      heartbeatPath: ReturnType<typeof AbsoluteFilePathStub>;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
      readHandle
        .calledWith([heartbeatPath])
        .rejects(Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' }));
    },

    getRemovedPaths: (): unknown[] => rmProxy.getRemovedPaths(),

    getKillGroupCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      killGroupProxy.getCallsFor({ pgid }),

    getReleasedRegistry: (): unknown => {
      const written = releaseProxy.getWrittenRegistry();
      return written;
    },

    getConnectionCountFor: ({
      socketPath,
    }: {
      socketPath: ReturnType<typeof AbsoluteFilePathStub>;
    }): ReturnType<typeof ReadingCountStub> =>
      ReadingCountStub({
        value: connectionHandle.callsMatching([{ path: socketPath }]).length,
      }),
  };
};
