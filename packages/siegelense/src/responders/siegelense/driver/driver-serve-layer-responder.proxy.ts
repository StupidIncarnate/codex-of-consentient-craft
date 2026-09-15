/**
 * PURPOSE: Test proxy for DriverServeLayerResponder — every child it composes is mocked directly
 * (driverHandleRequestBroker, driverHeartbeatTickBroker, DriverIdleWaitLayerResponder,
 * laneTeardownBroker, instanceReleaseBroker) because each already carries its own dedicated test
 * suite; this proxy only proves the WIRING between them. `netUnixServeAdapter` runs through its own
 * real proxy (mocking only 'net'/'fs') so a test drives a request through the real socket-framing
 * path via `connectClient()`/`sendFrame()`. `setInterval` and `process.on` are captured rather than
 * left real, so a test can fire a heartbeat tick or a signal handler on demand instead of waiting on
 * a real timer or sending a real OS signal to the test runner.
 *
 * USAGE:
 * const proxy = DriverServeLayerResponderProxy();
 * proxy.stageIdleWaitResolves({ killed: false });
 * const writes = proxy.sendSocketFrame({ frame: '{"kind":"ping","payload":""}\n' });
 */

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { netUnixServeAdapterProxy } from '../../../adapters/net/unix-serve/net-unix-serve-adapter.proxy';
import { driverHandleRequestBroker } from '../../../brokers/driver/handle-request/driver-handle-request-broker';
import { driverHandleRequestBrokerProxy } from '../../../brokers/driver/handle-request/driver-handle-request-broker.proxy';
import { driverHeartbeatTickBroker } from '../../../brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker';
import { driverHeartbeatTickBrokerProxy } from '../../../brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.proxy';
import { instanceReleaseBroker } from '../../../brokers/instance/release/instance-release-broker';
import { instanceReleaseBrokerProxy } from '../../../brokers/instance/release/instance-release-broker.proxy';
import { laneTeardownBroker } from '../../../brokers/lane/teardown/lane-teardown-broker';
import { laneTeardownBrokerProxy } from '../../../brokers/lane/teardown/lane-teardown-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';
import { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { driverSessionStateProxy } from '../../../state/driver-session/driver-session-state.proxy';
import { DriverIdleWaitLayerResponder } from './driver-idle-wait-layer-responder';
import { DriverIdleWaitLayerResponderProxy } from './driver-idle-wait-layer-responder.proxy';

type SignalCallback = () => void;

export const DriverServeLayerResponderProxy = (): {
  sendSocketFrame: (params: { frame: string }) => unknown[];
  stageHandleRequestResponds: (params: { response: DriverResponse }) => void;
  stageIdleWaitResolves: (params: { killed: boolean }) => void;
  getLaneTeardownCallCount: () => ReturnType<typeof ReadingCountStub>;
  getInstanceReleaseCallCount: () => ReturnType<typeof ReadingCountStub>;
  fireHeartbeatTick: () => void;
  stageHeartbeatTickFails: (params: { error: Error }) => void;
  getStderrWrites: () => unknown[];
  fireSignal: (params: { signal: 'SIGINT' | 'SIGTERM' }) => void;
} => {
  const socketProxy = netUnixServeAdapterProxy();
  socketProxy.setupFreshSocket();

  // Constructed for enforce-proxy-child-creation only — each is mocked directly below instead of
  // through these children's own setup methods.
  driverHandleRequestBrokerProxy();
  driverHeartbeatTickBrokerProxy();
  instanceReleaseBrokerProxy();
  laneTeardownBrokerProxy();
  DriverIdleWaitLayerResponderProxy();
  driverSessionStateProxy();
  // locationsSocketPathFindBroker runs REAL here (DriverServeLayerResponder never mocks it), so
  // its own proxy must be STAGED, not just constructed — otherwise it leaves the pathJoinAdapter
  // catch-all unconfigured and the real call underneath it throws.
  const socketPathProxy = locationsSocketPathFindBrokerProxy();
  socketPathProxy.setupSocketPath({
    tmpDir: '/tmp',
    socketPath: FilePathStub({ value: '/tmp/dm-siege-sockets/inst-serve-test.sock' }),
  });

  const handleRequestHandle = registerMock({ fn: driverHandleRequestBroker });
  handleRequestHandle
    .calledWith([])
    .resolves(DriverResponseStub({ ok: true, payload: '', error: null }));

  const heartbeatTickHandle = registerMock({ fn: driverHeartbeatTickBroker });
  heartbeatTickHandle.calledWith([]).resolves({ success: true });

  const idleWaitHandle = registerMock({ fn: DriverIdleWaitLayerResponder });
  idleWaitHandle.calledWith([]).resolves(false);

  const laneTeardownHandle = registerMock({ fn: laneTeardownBroker });
  laneTeardownHandle.calledWith([]).resolves(KillResultStub());

  const instanceReleaseHandle = registerMock({ fn: instanceReleaseBroker });
  instanceReleaseHandle.calledWith([]).resolves(RegistryEntryStub());

  const intervalCallbacks: (() => void)[] = [];
  registerSpyOn({ object: globalThis, method: 'setInterval' })
    .calledWith([])
    .implement(((callback: () => void) => {
      intervalCallbacks.push(callback);
      return 0 as unknown as NodeJS.Timeout;
    }) as typeof setInterval);
  registerSpyOn({ object: globalThis, method: 'clearInterval' }).calledWith([]).returns(undefined);

  const signalCallbacks: Partial<Record<'SIGINT' | 'SIGTERM', SignalCallback>> = {};
  registerSpyOn({ object: process, method: 'on' })
    .calledWith([])
    .implement(((signal: 'SIGINT' | 'SIGTERM', callback: SignalCallback) => {
      signalCallbacks[signal] = callback;
      return process;
    }) as typeof process.on);

  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrHandle.calledWith([]).returns(true);

  return {
    sendSocketFrame: ({ frame }: { frame: string }): unknown[] => {
      const client = socketProxy.connectClient();
      client.sendFrame({ frame });
      return client.getWrites();
    },

    stageHandleRequestResponds: ({ response }: { response: DriverResponse }): void => {
      handleRequestHandle.calledWith([]).resolves(response);
    },

    stageIdleWaitResolves: ({ killed }: { killed: boolean }): void => {
      idleWaitHandle.calledWith([]).resolves(killed);
    },

    getLaneTeardownCallCount: (): ReturnType<typeof ReadingCountStub> =>
      ReadingCountStub({ value: laneTeardownHandle.callsMatching([]).length }),

    getInstanceReleaseCallCount: (): ReturnType<typeof ReadingCountStub> =>
      ReadingCountStub({ value: instanceReleaseHandle.callsMatching([]).length }),

    fireHeartbeatTick: (): void => {
      intervalCallbacks.at(-1)?.();
    },

    stageHeartbeatTickFails: ({ error }: { error: Error }): void => {
      heartbeatTickHandle.calledWith([]).rejects(error);
    },

    getStderrWrites: (): unknown[] => stderrHandle.callsMatching([]).map((call) => call[0]),

    fireSignal: ({ signal }: { signal: 'SIGINT' | 'SIGTERM' }): void => {
      signalCallbacks[signal]?.();
    },
  };
};
