/**
 * PURPOSE: Test proxy for SiegelenseDriverResponder — mocks every broker it composes directly
 * (registryReadBroker, laneBootBroker, registryUpdateBroker, bootLockReleaseBroker,
 * bootFailureMarkerWriteBroker, driverLiveCheckBroker) plus its sibling DriverServeLayerResponder,
 * since each already carries its own dedicated test suite. driverLiveCheckBroker defaults to
 * `false` (no live driver) so every existing boot-sequence test keeps working unchanged;
 * `stageDriverAlreadyLive` is the one method that flips it, for the DEF-89 guard's own test. This
 * proxy only proves the boot SEQUENCE and the values handed from one step to the next.
 * laneSpecFindBroker runs real against its own proxy's sticky
 * default config (a single headless api process) — every test here passes `specName: 'api'`, which
 * matches it. The home resolver runs REAL, off its own proxy's sticky real-passthrough default —
 * never asserted on beyond identity, so which real `join` call consumes it never matters. The
 * evidence resolver instead stages only its root chain (`setupRootOnly`) and leaves its own outer
 * join to that same real passthrough default, because every test here picks its OWN `instanceId`
 * after the constructor already ran — `getExpectedEvidencePath` builds the real "unowned" shape
 * (guildId is null on every registry row this proxy's callers build) as a literal from that
 * instanceId, on demand, rather than a value this constructor could stage ahead of time. The socket
 * resolver hits the same problem the same way, so `getExpectedSocketPath` is also a literal built
 * from the fixed tmp dir, the socket statics and the instance id, never a call to the real
 * `locationsSocketPathFindBroker` — calling it would make the assertion compare the broker's own
 * output against itself.
 *
 * USAGE:
 * const proxy = SiegelenseDriverResponderProxy();
 * proxy.stageRegistryRow({ entry });
 * proxy.stageBootSucceeds({ lane });
 */

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';
import type { AbsoluteFilePath, SiegeInstance } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { getPidProxy } from '#gateway/node/process/get-pid/get-pid.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { bootFailureMarkerWriteBroker } from '../../../brokers/boot-failure-marker/write/boot-failure-marker-write-broker';
import { bootFailureMarkerWriteBrokerProxy } from '../../../brokers/boot-failure-marker/write/boot-failure-marker-write-broker.proxy';
import { bootLockReleaseBroker } from '../../../brokers/boot-lock/release/boot-lock-release-broker';
import { bootLockReleaseBrokerProxy } from '../../../brokers/boot-lock/release/boot-lock-release-broker.proxy';
import { driverLiveCheckBroker } from '../../../brokers/driver/live-check/driver-live-check-broker';
import { driverLiveCheckBrokerProxy } from '../../../brokers/driver/live-check/driver-live-check-broker.proxy';
import { laneBootBroker } from '../../../brokers/lane/boot/lane-boot-broker';
import { laneBootBrokerProxy } from '../../../brokers/lane/boot/lane-boot-broker.proxy';
import { laneSpecFindBrokerProxy } from '../../../brokers/lane-spec/find/lane-spec-find-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsInstanceHomePathFindBrokerProxy } from '../../../brokers/locations/instance-home-path-find/locations-instance-home-path-find-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import { registryUpdateBroker } from '../../../brokers/registry/update/registry-update-broker';
import { registryUpdateBrokerProxy } from '../../../brokers/registry/update/registry-update-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { Registry } from '../../../contracts/registry/registry-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { DriverServeLayerResponder } from './driver-serve-layer-responder';
import { DriverServeLayerResponderProxy } from './driver-serve-layer-responder.proxy';

type ReadingCount = ReturnType<typeof ReadingCountStub>;

const SHARED_PATH_VALUE = '/tmp/dm-siege-sockets/inst-driver-test.sock';
// Mirrors osTmpdirAdapterProxy's own default, composed transitively via
// locationsSocketPathFindBrokerProxy and never overridden here.
const TMP_DIR_VALUE = '/tmp';

export const SiegelenseDriverResponderProxy = (): {
  stageRegistryRow: (params: { entry: RegistryEntry }) => void;
  stageEmptyRegistry: () => void;
  stageDriverAlreadyLive: (params: { entry: RegistryEntry }) => void;
  stageBootSucceeds: (params: { lane: LaneSession; instanceId: SiegeInstance['id'] }) => void;
  stageBootFails: (params: { error: Error; instanceId: SiegeInstance['id'] }) => void;
  stageBootFailsAndMarkerWriteFails: (params: {
    error: Error;
    markerWriteError: Error;
    instanceId: SiegeInstance['id'];
  }) => void;
  applyRegistryMutate: (params: { current: Registry }) => Registry;
  getServeCallArgs: () => unknown;
  getExpectedSocketPath: (params: { instanceId: SiegeInstance['id'] }) => AbsoluteFilePath;
  getExpectedEvidencePath: (params: { instanceId: SiegeInstance['id'] }) => AbsoluteFilePath;
  getBootLockReleaseCallArgs: () => unknown;
  getBootFailureMarkerWriteCallArgs: () => unknown;
  getRegistryUpdateCallCount: () => ReadingCount;
  stagePid: (params: { pid: number }) => void;
  getStderrText: () => ReturnType<typeof ContentTextStub>;
} => {
  const pidProxy = getPidProxy();
  // The responder logs a failed boot-failure-marker write to stderr; recorded here, off the runner's output.
  const stderrLog = stderrProxy();
  laneBootBrokerProxy();
  DriverServeLayerResponderProxy();
  laneSpecFindBrokerProxy();
  bootLockReleaseBrokerProxy();
  registryReadBrokerProxy();
  registryUpdateBrokerProxy();
  bootFailureMarkerWriteBrokerProxy();
  // Unassigned — driverLiveCheckBroker is mocked directly below (registerMock), not through this
  // proxy's own semantic setup methods, same as laneBootBrokerProxy() above. Present only to satisfy
  // enforce-proxy-child-creation.
  driverLiveCheckBrokerProxy();

  // locationsInstanceHomePathFindBroker runs REAL here, never asserted on beyond identity, so its
  // own proxy's sticky real-passthrough default (`#gateway/node/path`'s `join`, composed
  // transitively via locationsInstanceEvidencePathFindBrokerProxy below) is enough on its own; this
  // file only composes its proxy for enforce-proxy-child-creation.
  locationsInstanceHomePathFindBrokerProxy();
  // instanceId is only chosen by each test AFTER this constructor already ran, so the exact final
  // evidencePath can't be staged here — setupRootOnly stages just the root chain and getExpectedEvidencePath
  // computes the real "unowned" shape (guildId is null on every registry row this proxy's callers
  // build) on demand from the caller's own instanceId.
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  evidencePathProxy.setupRootOnly({
    homeDir: '/home/user',
    homePath: SHARED_PATH_VALUE,
    rootPath: SHARED_PATH_VALUE,
  });
  // instanceId is only chosen by each test AFTER this constructor already ran, so the exact final
  // socketPath can't be staged here either — locationsSocketPathFindBrokerProxy's own sticky
  // real-passthrough default answers the real call, and getExpectedSocketPath computes the same
  // real value on demand from the caller's own instanceId.
  locationsSocketPathFindBrokerProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const laneBootHandle = registerMock({ fn: laneBootBroker });
  const registryUpdateHandle = registerMock({ fn: registryUpdateBroker });
  const bootLockReleaseHandle = registerMock({ fn: bootLockReleaseBroker });
  const bootFailureMarkerWriteHandle = registerMock({ fn: bootFailureMarkerWriteBroker });
  const serveHandle = registerMock({ fn: DriverServeLayerResponder });
  const driverLiveCheckHandle = registerMock({ fn: driverLiveCheckBroker });

  return {
    stageRegistryRow: ({ entry }: { entry: RegistryEntry }): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [entry] });
      // Not-live is the answer every boot-sequence test needs; `stageDriverAlreadyLive` restages
      // this same address.
      driverLiveCheckHandle.calledWith([{ entry }]).resolves(false);
    },

    stageEmptyRegistry: (): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [] });
    },

    stageDriverAlreadyLive: ({ entry }: { entry: RegistryEntry }): void => {
      driverLiveCheckHandle.calledWith([{ entry }]).resolves(true);
    },

    stageBootSucceeds: ({
      lane,
      instanceId,
    }: {
      lane: LaneSession;
      instanceId: SiegeInstance['id'];
    }): void => {
      laneBootHandle.calledWith([{ instanceId }]).resolves(lane);
      registryUpdateHandle
        .calledWith([{ mutate: (value: unknown): boolean => typeof value === 'function' }])
        .implement(
          async ({ mutate }: { mutate: (current: Registry) => Registry }): Promise<Registry> =>
            Promise.resolve(mutate({ instances: [] })),
        );
      bootLockReleaseHandle.calledWith([{ instanceId }]).resolves({ success: true });
      serveHandle.calledWith([{ instanceId }]).resolves({ success: true });
    },

    stageBootFails: ({ error, instanceId }: { error: Error; instanceId: SiegeInstance['id'] }): void => {
      laneBootHandle.calledWith([{ instanceId }]).rejects(error);
      bootLockReleaseHandle.calledWith([{ instanceId }]).resolves({ success: true });
      bootFailureMarkerWriteHandle.calledWith([{ message: error.message }]).resolves({
        message: ContentTextStub({ value: error.message }),
        atMs: EpochMsStub(),
      });
    },

    stageBootFailsAndMarkerWriteFails: ({
      error,
      markerWriteError,
      instanceId,
    }: {
      error: Error;
      markerWriteError: Error;
      instanceId: SiegeInstance['id'];
    }): void => {
      laneBootHandle.calledWith([{ instanceId }]).rejects(error);
      bootLockReleaseHandle.calledWith([{ instanceId }]).resolves({ success: true });
      bootFailureMarkerWriteHandle
        .calledWith([{ message: error.message }])
        .rejects(markerWriteError);
    },

    applyRegistryMutate: ({ current }: { current: Registry }): Registry => {
      const mutateFns = registryUpdateHandle
        .callsMatching([])
        .map((call) => (call[0] as Parameters<typeof registryUpdateBroker>[0]).mutate);
      const lastMutate = mutateFns[mutateFns.length - 1];
      if (lastMutate === undefined) {
        throw new Error('registryUpdateBroker was never called');
      }
      return lastMutate(current);
    },

    getServeCallArgs: (): unknown => {
      const argsList = serveHandle.callsMatching([]).map((call) => call[0]);
      return argsList[argsList.length - 1];
    },

    // Built independently from the fixed tmp dir, the socket statics and the instance id — never
    // by calling the real `locationsSocketPathFindBroker`, which would make this assertion compare
    // the broker's own output against itself and let a wrong path pass silently.
    getExpectedSocketPath: ({ instanceId }: { instanceId: SiegeInstance['id'] }): AbsoluteFilePath =>
      AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/${locationsStatics.siegelense.socketsDirName}/${instanceId}${evidenceFileStatics.extensions.socket}`,
      }),

    // Every registry row this proxy's callers build carries `guildId: null` (RegistryEntryStub's
    // own default, never overridden here), so the broker's real "unowned" shape —
    // `<rootPath>/unowned/instances/<instanceId>` — is what the unstaged outer join genuinely
    // computes off SHARED_PATH_VALUE (staged as rootPath via setupRootOnly above).
    getExpectedEvidencePath: ({ instanceId }: { instanceId: SiegeInstance['id'] }): AbsoluteFilePath =>
      AbsoluteFilePathStub({
        value: `${SHARED_PATH_VALUE}/${locationsStatics.siegelense.unownedDir}/${locationsStatics.siegelense.instancesDir}/${instanceId}`,
      }),

    getBootLockReleaseCallArgs: (): unknown => {
      const argsList = bootLockReleaseHandle.callsMatching([]).map((call) => call[0]);
      return argsList[argsList.length - 1];
    },

    getBootFailureMarkerWriteCallArgs: (): unknown => {
      const argsList = bootFailureMarkerWriteHandle.callsMatching([]).map((call) => call[0]);
      return argsList[argsList.length - 1];
    },

    getRegistryUpdateCallCount: (): ReadingCount =>
      ReadingCountStub({ value: registryUpdateHandle.callsMatching([]).length }),

    stagePid: ({ pid }: { pid: number }): void => {
      pidProxy.setupPid({ pid });
    },

    getStderrText: (): ReturnType<typeof ContentTextStub> =>
      ContentTextStub({ value: stderrLog.getWrittenText() }),
  };
};
