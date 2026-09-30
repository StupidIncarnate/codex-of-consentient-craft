/**
 * PURPOSE: Test proxy for DriverServeLayerResponder — every child it composes is mocked directly
 * (driverHandleRequestBroker, driverHeartbeatTickBroker, DriverIdleWaitLayerResponder,
 * laneTeardownBroker, instanceReleaseBroker, shutdownReasonWriteBroker) because each already carries
 * its own dedicated test suite; this proxy only proves the WIRING between them.
 * `locationsInstanceEvidencePathFindBroker` runs REAL here (never mocked, like
 * `locationsSocketPathFindBroker`), so its own proxy is STAGED rather than left unconfigured.
 * `unixSocketServe` runs through its own gateway proxy, bound at the socket path the real
 * `locationsSocketPathFindBroker` resolves for `InstanceIdStub()`'s default id, so a test drives a
 * request line through the real line-framing path via `sendSocketLine()`, and
 * `getSocketCloseCallCount()` reads that gateway proxy's own close counter for that path — proving
 * THIS responder called `close()` on its way out.
 * `setInterval` and `process.on` are captured rather than left real, so a test can fire a heartbeat
 * tick or a signal handler on demand instead of waiting on a real timer or sending a real OS signal
 * to the test runner.
 *
 * USAGE:
 * const proxy = DriverServeLayerResponderProxy();
 * proxy.stageIdleWaitResolves({ killed: false });
 * const client = proxy.sendSocketLine({ line: '{"kind":"ping","payload":""}' });
 */

import { clearIntervalProxy } from '#gateway/node/clearInterval/clear-interval/clear-interval.proxy';
import { unixSocketServeProxy } from '#gateway/node/net/unix-socket-serve/unix-socket-serve.proxy';
import { onProxy } from '#gateway/node/process/on/on.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { IntervalHandleStub } from '#gateway/node/setInterval/interval-handle.stub';
import { setIntervalProxy } from '#gateway/node/setInterval/set-interval/set-interval.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { driverHandleRequestBroker } from '../../../brokers/driver/handle-request/driver-handle-request-broker';
import { driverHandleRequestBrokerProxy } from '../../../brokers/driver/handle-request/driver-handle-request-broker.proxy';
import { driverHeartbeatTickBroker } from '../../../brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker';
import { driverHeartbeatTickBrokerProxy } from '../../../brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.proxy';
import { instanceReleaseBroker } from '../../../brokers/instance/release/instance-release-broker';
import { instanceReleaseBrokerProxy } from '../../../brokers/instance/release/instance-release-broker.proxy';
import { laneTeardownBroker } from '../../../brokers/lane/teardown/lane-teardown-broker';
import { laneTeardownBrokerProxy } from '../../../brokers/lane/teardown/lane-teardown-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { shutdownReasonWriteBroker } from '../../../brokers/shutdown-reason/write/shutdown-reason-write-broker';
import { shutdownReasonWriteBrokerProxy } from '../../../brokers/shutdown-reason/write/shutdown-reason-write-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';
import { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';
import { driverSessionStateProxy } from '../../../state/driver-session/driver-session-state.proxy';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { DriverIdleWaitLayerResponder } from './driver-idle-wait-layer-responder';
import { DriverIdleWaitLayerResponderProxy } from './driver-idle-wait-layer-responder.proxy';

// `locationsSocketPathFindBroker`'s real answer for `InstanceIdStub()`'s default id under its own
// proxy's `/tmp` tmpdir default — the id every test of this responder serves.
const SOCKET_PATH_VALUE = '/tmp/dm-siege-sockets/inst_7f3a9c21.sock';
// `InstanceIdStub()`'s default — every broker this responder calls receives it, so each mock below
// is addressed by it (a prefix match on the one key, whatever else the call carries).
const INSTANCE_ADDRESS = { instanceId: 'inst_7f3a9c21' };
// The kill signal is a promise the responder creates itself, so the address is its type.
const KILL_SIGNAL_ADDRESS = { killSignal: (value: unknown): boolean => value instanceof Promise };
const EVIDENCE_PATH_VALUE = '/tmp/dm-siege-evidence-test/unowned/instances/inst_7f3a9c21';

export const DriverServeLayerResponderProxy = (): {
  // Opens one connection and sends `line`; the replies land asynchronously, so read
  // `getWrittenLines()` (every line written back, newline stripped, in order) once it has settled.
  sendSocketLine: (params: { line: string }) => {
    getWrittenLines: () => readonly string[];
  };
  stageHandleRequestResponds: (params: { response: DriverResponse }) => void;
  stageHandleRequestFails: (params: { error: Error }) => void;
  getHandleRequestCallCount: () => number;
  getSocketDirCreateCalls: () => readonly unknown[][];
  stageIdleWaitResolves: (params: { killed: boolean }) => void;
  getLaneTeardownCallCount: () => number;
  getInstanceReleaseCallCount: () => number;
  getSocketCloseCallCount: () => number;
  getShutdownReasonWriteCallArgs: () => unknown;
  fireHeartbeatTick: () => void;
  stageHeartbeatTickFails: (params: { error: Error }) => void;
  getStderrWrites: () => unknown[];
  fireSignal: (params: { signal: 'SIGINT' | 'SIGTERM' }) => void;
} => {
  const socketProxy = unixSocketServeProxy();
  socketProxy.listens({ socketPath: SOCKET_PATH_VALUE });

  // Constructed for enforce-proxy-child-creation only — each is mocked directly below instead of
  // through these children's own setup methods.
  driverHandleRequestBrokerProxy();
  driverHeartbeatTickBrokerProxy();
  instanceReleaseBrokerProxy();
  laneTeardownBrokerProxy();
  DriverIdleWaitLayerResponderProxy();
  driverSessionStateProxy();
  shutdownReasonWriteBrokerProxy();
  // locationsSocketPathFindBroker runs REAL here (DriverServeLayerResponder never mocks it) — its
  // own proxy's sticky real-passthrough default (`#gateway/node/path`'s `join`, plus
  // osTmpdirAdapterProxy's own '/tmp' default) already answers every test in this file's own
  // instanceId, so this file only composes it for enforce-proxy-child-creation.
  // locationsInstanceEvidencePathFindBroker ALSO runs real, but its own resolution reaches
  // dungeonmasterHomeFindBroker's unaddressed `homedir()` call underneath — which throws unless
  // staged — so its proxy must be STAGED below, not just constructed.
  locationsSocketPathFindBrokerProxy();
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  // guildId is null on every call this proxy's tests make (see this responder's own test file),
  // so the real broker's own "unowned" shape — <rootPath>/unowned/instances/<instanceId> — is what
  // this must stage, using InstanceIdStub()'s own default 'inst_7f3a9c21' every call here leaves
  // unoverridden.
  evidencePathProxy.setupInstanceEvidencePath({
    homeDir: '/home/user',
    homePath: '/tmp/dm-siege-evidence-test',
    rootPath: '/tmp/dm-siege-evidence-test',
    evidencePath: EVIDENCE_PATH_VALUE,
  });

  const handleRequestHandle = registerMock({ fn: driverHandleRequestBroker });
  handleRequestHandle
    .calledWith([INSTANCE_ADDRESS])
    .resolves(DriverResponseStub({ ok: true, payload: '', error: null }));

  const heartbeatTickHandle = registerMock({ fn: driverHeartbeatTickBroker });
  heartbeatTickHandle.calledWith([INSTANCE_ADDRESS]).resolves(undefined);

  const idleWaitHandle = registerMock({ fn: DriverIdleWaitLayerResponder });
  idleWaitHandle.calledWith([KILL_SIGNAL_ADDRESS]).resolves(false);

  const laneTeardownHandle = registerMock({ fn: laneTeardownBroker });
  laneTeardownHandle.calledWith([INSTANCE_ADDRESS]).resolves(KillResultStub());

  const instanceReleaseHandle = registerMock({ fn: instanceReleaseBroker });
  instanceReleaseHandle.calledWith([INSTANCE_ADDRESS]).resolves(RegistryEntryStub());

  const shutdownReasonWriteHandle = registerMock({ fn: shutdownReasonWriteBroker });
  shutdownReasonWriteHandle
    .calledWith([{ evidencePath: EVIDENCE_PATH_VALUE }])
    .resolves(ShutdownReasonStub());

  // A staged period arms nothing: `fireHeartbeatTick` runs the callback the responder handed over,
  // so a test never waits on a real timer.
  const intervalProxy = setIntervalProxy();
  intervalProxy.stageHandle({
    ms: instanceLifecycleStatics.heartbeat.intervalMs,
    handle: IntervalHandleStub(),
  });
  clearIntervalProxy();

  const signalProxy = onProxy();
  const stderr = stderrProxy();

  return {
    sendSocketLine: ({
      line,
    }: {
      line: string;
    }): { getWrittenLines: () => readonly string[] } => {
      const client = socketProxy.connectClient({ socketPath: SOCKET_PATH_VALUE });
      client.sendLine({ line });
      return {
        getWrittenLines: (): readonly string[] =>
          client.getWrittenLines().map((written) => written),
      };
    },

    stageHandleRequestResponds: ({ response }: { response: DriverResponse }): void => {
      handleRequestHandle.calledWith([INSTANCE_ADDRESS]).resolves(response);
    },

    stageHandleRequestFails: ({ error }: { error: Error }): void => {
      handleRequestHandle.calledWith([INSTANCE_ADDRESS]).rejects(error);
    },

    getHandleRequestCallCount: (): number =>
      handleRequestHandle.callsMatching([INSTANCE_ADDRESS]).length,

    getSocketDirCreateCalls: (): readonly unknown[][] =>
      socketProxy.getMkdirCallsFor({ socketPath: SOCKET_PATH_VALUE }),

    stageIdleWaitResolves: ({ killed }: { killed: boolean }): void => {
      idleWaitHandle.calledWith([KILL_SIGNAL_ADDRESS]).resolves(killed);
    },

    getLaneTeardownCallCount: (): number =>
      laneTeardownHandle.callsMatching([INSTANCE_ADDRESS]).length,

    getInstanceReleaseCallCount: (): number =>
      instanceReleaseHandle.callsMatching([INSTANCE_ADDRESS]).length,

    getSocketCloseCallCount: (): number =>
      socketProxy.getCloseCountFor({ socketPath: SOCKET_PATH_VALUE }),

    getShutdownReasonWriteCallArgs: (): unknown => {
      const argsList = shutdownReasonWriteHandle
        .callsMatching([{ evidencePath: EVIDENCE_PATH_VALUE }])
        .map((call) => call[0]);
      return argsList[argsList.length - 1];
    },

    fireHeartbeatTick: (): void => {
      const [callback] = [
        ...intervalProxy.getCallsFor({ ms: instanceLifecycleStatics.heartbeat.intervalMs }),
      ]
        .map((call) => call[0])
        .slice(-1);
      if (typeof callback === 'function') {
        Reflect.apply(callback, undefined, []);
      }
    },

    stageHeartbeatTickFails: ({ error }: { error: Error }): void => {
      heartbeatTickHandle.calledWith([INSTANCE_ADDRESS]).rejects(error);
    },

    getStderrWrites: (): unknown[] => [...stderr.getWrites()],

    fireSignal: ({ signal }: { signal: 'SIGINT' | 'SIGTERM' }): void => {
      const [callback] = [...signalProxy.callsMatching()]
        .filter((call) => call[0] === signal)
        .map((call) => call[1])
        .slice(-1);
      if (typeof callback === 'function') {
        Reflect.apply(callback, undefined, []);
      }
    },
  };
};
