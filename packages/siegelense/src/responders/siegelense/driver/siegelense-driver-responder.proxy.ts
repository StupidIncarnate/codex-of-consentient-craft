/**
 * PURPOSE: Test proxy for SiegelenseDriverResponder — mocks every broker it composes directly
 * (registryReadBroker, laneBootBroker, registryUpdateBroker, bootLockReleaseBroker,
 * bootFailureMarkerWriteBroker) plus its sibling DriverServeLayerResponder, since each already
 * carries its own dedicated test suite. This proxy only proves the boot SEQUENCE and the values
 * handed from one step to the next. laneSpecFindBroker runs real (it is pure and only needs a real
 * spec name). The three locations resolvers share ONE underlying `pathJoinAdapter` mock, which
 * queues each `.returns()` call as a ONE-SHOT for the NEXT real invocation
 * (`packages/testing/CLAUDE.md`) — rather than track exactly how many real pathJoin calls land
 * between staging and assertion, every one of the three is staged to the SAME path value, so
 * whichever queue slot a given call consumes, the socket path this proxy's caller checks always
 * matches. `bootLockReleaseBrokerProxy()`'s OWN constructor unconditionally stages 3 one-shots on
 * that SAME shared queue (`boot-lock-release-broker.proxy.ts`'s `setupBootLockPath` call) — orphaned
 * here, since `bootLockReleaseBroker` is mocked directly rather than through its own proxy's setup
 * methods — so the drain below consumes them before the three locations resolvers stage theirs,
 * the same fix `instance-start-broker.proxy.ts` applies for the same reason.
 *
 * USAGE:
 * const proxy = SiegelenseDriverResponderProxy();
 * proxy.stageRegistryRow({ entry });
 * proxy.stageBootSucceeds({ lane });
 */

import { join } from 'path';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { bootFailureMarkerWriteBroker } from '../../../brokers/boot-failure-marker/write/boot-failure-marker-write-broker';
import { bootFailureMarkerWriteBrokerProxy } from '../../../brokers/boot-failure-marker/write/boot-failure-marker-write-broker.proxy';
import { bootLockReleaseBroker } from '../../../brokers/boot-lock/release/boot-lock-release-broker';
import { bootLockReleaseBrokerProxy } from '../../../brokers/boot-lock/release/boot-lock-release-broker.proxy';
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
import { DriverServeLayerResponder } from './driver-serve-layer-responder';
import { DriverServeLayerResponderProxy } from './driver-serve-layer-responder.proxy';

type ReadingCount = ReturnType<typeof ReadingCountStub>;

const SHARED_PATH_VALUE = '/tmp/dm-siege-sockets/inst-driver-test.sock';
const SOCKET_PATH = AbsoluteFilePathStub({ value: SHARED_PATH_VALUE });

export const SiegelenseDriverResponderProxy = (): {
  stageRegistryRow: (params: { entry: RegistryEntry }) => void;
  stageEmptyRegistry: () => void;
  stageBootSucceeds: (params: { lane: LaneSession }) => void;
  stageBootFails: (params: { error: Error }) => void;
  stageBootFailsAndMarkerWriteFails: (params: { error: Error; markerWriteError: Error }) => void;
  applyRegistryMutate: (params: { current: Registry }) => Registry;
  getServeCallArgs: () => unknown;
  getExpectedSocketPath: () => AbsoluteFilePath;
  getExpectedEvidencePath: () => AbsoluteFilePath;
  getBootLockReleaseCallArgs: () => unknown;
  getBootFailureMarkerWriteCallArgs: () => unknown;
  getRegistryUpdateCallCount: () => ReadingCount;
} => {
  laneBootBrokerProxy();
  DriverServeLayerResponderProxy();
  laneSpecFindBrokerProxy();
  bootLockReleaseBrokerProxy();
  registryReadBrokerProxy();
  registryUpdateBrokerProxy();
  bootFailureMarkerWriteBrokerProxy();

  // Drains the exactly 6 one-shot pathJoin entries queued before this line, on the SAME shared
  // pathJoinAdapter mock: 1 from `DriverServeLayerResponderProxy()`'s own unconditional
  // `setupSocketPath` (its own socket-path join, for a socket `DriverServeLayerResponder` never
  // really binds in this proxy's tests — `DriverServeLayerResponder` itself is mocked wholesale
  // below), 3 more from that SAME constructor's OWN unconditional evidence-path staging (homedir
  // join + root-path join + evidence-path join — `locations-instance-evidence-path-find-broker
  // .proxy.ts` composing `locations-root-path-find-broker.proxy.ts`), and 3 from
  // `bootLockReleaseBrokerProxy`'s own constructor (homedir join + root-path join + boot-lock join).
  // Six plain calls, not a loop or `.forEach()` — `enforce-proxy-patterns` scans the constructor's
  // own top-level statements for exactly those shapes, and a bounded, known-small count reads as
  // clearly as a loop would here anyway.
  join('drain', '0');
  join('drain', '1');
  join('drain', '2');
  join('drain', '3');
  join('drain', '4');
  join('drain', '5');

  // These three share one pathJoinAdapter mock, queued one-shot per real call rather than a sticky
  // catch-all — staging every one of them to the SAME path value sidesteps having to track exactly
  // which real call consumes which queued slot.
  const homePathProxy = locationsInstanceHomePathFindBrokerProxy();
  homePathProxy.setupHomePath({
    tmpDir: '/tmp',
    homePath: FilePathStub({ value: SHARED_PATH_VALUE }),
  });
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  evidencePathProxy.setupInstanceEvidencePath({
    homeDir: '/home/user',
    homePath: FilePathStub({ value: SHARED_PATH_VALUE }),
    rootPath: FilePathStub({ value: SHARED_PATH_VALUE }),
    evidencePath: FilePathStub({ value: SHARED_PATH_VALUE }),
  });
  const socketPathProxy = locationsSocketPathFindBrokerProxy();
  socketPathProxy.setupSocketPath({
    tmpDir: '/tmp',
    socketPath: FilePathStub({ value: SHARED_PATH_VALUE }),
  });

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const laneBootHandle = registerMock({ fn: laneBootBroker });
  const registryUpdateHandle = registerMock({ fn: registryUpdateBroker });
  const bootLockReleaseHandle = registerMock({ fn: bootLockReleaseBroker });
  bootLockReleaseHandle.calledWith([]).resolves({ success: true });

  const bootFailureMarkerWriteHandle = registerMock({ fn: bootFailureMarkerWriteBroker });
  // Sticky success default — every `stageBootFails` scenario reaches this call, and only a test
  // asserting the write itself throws needs a different answer.
  bootFailureMarkerWriteHandle.calledWith([]).resolves({
    message: ContentTextStub({ value: 'stub boot failure message' }),
    atMs: EpochMsStub(),
  });

  const serveHandle = registerMock({ fn: DriverServeLayerResponder });
  serveHandle.calledWith([]).resolves({ success: true });

  return {
    stageRegistryRow: ({ entry }: { entry: RegistryEntry }): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [entry] });
    },

    stageEmptyRegistry: (): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [] });
    },

    stageBootSucceeds: ({ lane }: { lane: LaneSession }): void => {
      laneBootHandle.calledWith([]).resolves(lane);
      registryUpdateHandle
        .calledWith([])
        .implement(
          async ({ mutate }: { mutate: (current: Registry) => Registry }): Promise<Registry> =>
            Promise.resolve(mutate({ instances: [] })),
        );
    },

    stageBootFails: ({ error }: { error: Error }): void => {
      laneBootHandle.calledWith([]).rejects(error);
    },

    stageBootFailsAndMarkerWriteFails: ({
      error,
      markerWriteError,
    }: {
      error: Error;
      markerWriteError: Error;
    }): void => {
      laneBootHandle.calledWith([]).rejects(error);
      bootFailureMarkerWriteHandle.calledWith([]).rejects(markerWriteError);
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

    getExpectedSocketPath: (): AbsoluteFilePath => SOCKET_PATH,

    // Home, evidence and socket resolvers are all staged to the SAME shared path value (see this
    // proxy's own header) — a distinctly-named accessor for the evidence half keeps a test that
    // asserts `bootFailureMarkerWriteBroker`'s `evidencePath` argument from reading as if it cared
    // about the socket instead.
    getExpectedEvidencePath: (): AbsoluteFilePath => SOCKET_PATH,

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
  };
};
