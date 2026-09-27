/**
 * PURPOSE: Test proxy for SiegelenseDriverResponder — mocks every broker it composes directly
 * (registryReadBroker, laneBootBroker, registryUpdateBroker, bootLockReleaseBroker,
 * bootFailureMarkerWriteBroker) plus its sibling DriverServeLayerResponder, since each already
 * carries its own dedicated test suite. This proxy only proves the boot SEQUENCE and the values
 * handed from one step to the next. laneSpecFindBroker runs real against its own proxy's sticky
 * default config (a single headless api process) — every test here passes `specName: 'api'`, which
 * matches it. The home resolver is staged to a fixed shared path value — never asserted on beyond
 * identity, so which real `join` call consumes it never matters. The evidence resolver instead
 * stages only its root chain (`setupRootOnly`) and leaves its own outer
 * join to the real passthrough default, because every test here picks its OWN `instanceId` after
 * the constructor already ran — `getExpectedEvidencePath` computes the real "unowned" shape
 * (guildId is null on every registry row this proxy's callers build) from that instanceId, on
 * demand, rather than a value this constructor could stage ahead of time. The socket resolver hits
 * the same problem the same way: `getExpectedSocketPath` calls the REAL
 * `locationsSocketPathFindBroker` with the caller's own instanceId, which resolves off
 * `locationsSocketPathFindBrokerProxy`'s own sticky real-passthrough default rather than a value
 * staged here for an instanceId the constructor cannot know yet.
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
import { locationsStatics } from '@dungeonmaster/shared/statics';
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
import { locationsSocketPathFindBroker } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker';
import { locationsSocketPathFindBrokerProxy } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import { registryUpdateBroker } from '../../../brokers/registry/update/registry-update-broker';
import { registryUpdateBrokerProxy } from '../../../brokers/registry/update/registry-update-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { Registry } from '../../../contracts/registry/registry-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { DriverServeLayerResponder } from './driver-serve-layer-responder';
import { DriverServeLayerResponderProxy } from './driver-serve-layer-responder.proxy';

type ReadingCount = ReturnType<typeof ReadingCountStub>;

const SHARED_PATH_VALUE = '/tmp/dm-siege-sockets/inst-driver-test.sock';

export const SiegelenseDriverResponderProxy = (): {
  stageRegistryRow: (params: { entry: RegistryEntry }) => void;
  stageEmptyRegistry: () => void;
  stageBootSucceeds: (params: { lane: LaneSession }) => void;
  stageBootFails: (params: { error: Error }) => void;
  stageBootFailsAndMarkerWriteFails: (params: { error: Error; markerWriteError: Error }) => void;
  applyRegistryMutate: (params: { current: Registry }) => Registry;
  getServeCallArgs: () => unknown;
  getExpectedSocketPath: (params: { instanceId: InstanceId }) => AbsoluteFilePath;
  getExpectedEvidencePath: (params: { instanceId: InstanceId }) => AbsoluteFilePath;
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

  // Drains one-shot pathJoin entries queued before this line, on the SAME shared raw-'path' mock
  // every still-old-adapter resolver in this chain shares (never the gateway `#gateway/node/path`
  // `join` the migrated resolvers below use — a different captured reference, per
  // dungeonmaster-home-find-broker.proxy.ts's own header) — `DriverServeLayerResponderProxy()`'s
  // own unconditional `setupSocketPath`, and `bootLockReleaseBrokerProxy`'s own constructor, both
  // still on the old adapter. A drain past the real queue length is harmless: it falls through to
  // that mock's own sticky real-passthrough default instead of an unconfigured-call throw. Plain
  // calls, not a loop or `.forEach()` — `enforce-proxy-patterns` scans the constructor's own
  // top-level statements for exactly those shapes.
  join('drain', '0');
  join('drain', '1');
  join('drain', '2');
  join('drain', '3');
  join('drain', '4');
  join('drain', '5');

  // Home and socket still share one old-adapter pathJoin mock, queued one-shot per real call rather
  // than a sticky catch-all — staging both to the SAME path value sidesteps having to track exactly
  // which real call consumes which queued slot. Neither is asserted on beyond identity.
  const homePathProxy = locationsInstanceHomePathFindBrokerProxy();
  homePathProxy.setupHomePath({
    tmpDir: '/tmp',
    homePath: FilePathStub({ value: SHARED_PATH_VALUE }),
  });
  // instanceId is only chosen by each test AFTER this constructor already ran, so the exact final
  // evidencePath can't be staged here — setupRootOnly stages just the root chain and getExpectedEvidencePath
  // computes the real "unowned" shape (guildId is null on every registry row this proxy's callers
  // build) on demand from the caller's own instanceId.
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  evidencePathProxy.setupRootOnly({
    homeDir: '/home/user',
    homePath: FilePathStub({ value: SHARED_PATH_VALUE }),
    rootPath: FilePathStub({ value: SHARED_PATH_VALUE }),
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

    // Computed off the REAL broker rather than a stored literal, because the constructor never
    // knows which instanceId a test will pick — the same reason getExpectedEvidencePath below is
    // computed on demand instead of staged ahead of time.
    getExpectedSocketPath: ({ instanceId }: { instanceId: InstanceId }): AbsoluteFilePath =>
      locationsSocketPathFindBroker({ instanceId }),

    // Every registry row this proxy's callers build carries `guildId: null` (RegistryEntryStub's
    // own default, never overridden here), so the broker's real "unowned" shape —
    // `<rootPath>/unowned/instances/<instanceId>` — is what the unstaged outer join genuinely
    // computes off SHARED_PATH_VALUE (staged as rootPath via setupRootOnly above).
    getExpectedEvidencePath: ({ instanceId }: { instanceId: InstanceId }): AbsoluteFilePath =>
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
  };
};
