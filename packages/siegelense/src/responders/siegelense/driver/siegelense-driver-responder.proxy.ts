/**
 * PURPOSE: Test proxy for SiegelenseDriverResponder — mocks every broker it composes directly
 * (registryReadBroker, laneBootBroker, registryUpdateBroker, bootLockReleaseBroker) plus its sibling
 * DriverServeLayerResponder, since each already carries its own dedicated test suite. This proxy
 * only proves the boot SEQUENCE and the values handed from one step to the next. laneSpecFindBroker
 * runs real (it is pure and only needs a real spec name). The three locations resolvers share ONE
 * underlying `pathJoinAdapter` mock, which queues each `.returns()` call as a ONE-SHOT for the NEXT
 * real invocation (`packages/testing/CLAUDE.md`) — rather than track exactly how many real pathJoin
 * calls land between staging and assertion, every one of the three is staged to the SAME path value,
 * so whichever queue slot a given call consumes, the socket path this proxy's caller checks always
 * matches.
 *
 * USAGE:
 * const proxy = SiegelenseDriverResponderProxy();
 * proxy.stageRegistryRow({ entry });
 * proxy.stageBootSucceeds({ lane });
 */

import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { Registry } from '../../../contracts/registry/registry-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { DriverServeLayerResponder } from './driver-serve-layer-responder';
import { DriverServeLayerResponderProxy } from './driver-serve-layer-responder.proxy';

const SHARED_PATH_VALUE = '/tmp/dm-siege-sockets/inst-driver-test.sock';
const SOCKET_PATH = AbsoluteFilePathStub({ value: SHARED_PATH_VALUE });

export const SiegelenseDriverResponderProxy = (): {
  stageRegistryRow: (params: { entry: RegistryEntry }) => void;
  stageEmptyRegistry: () => void;
  stageBootSucceeds: (params: { lane: LaneSession }) => void;
  applyRegistryMutate: (params: { current: Registry }) => Registry;
  getServeCallArgs: () => unknown;
  getExpectedSocketPath: () => AbsoluteFilePath;
} => {
  laneBootBrokerProxy();
  DriverServeLayerResponderProxy();
  laneSpecFindBrokerProxy();
  bootLockReleaseBrokerProxy();
  registryReadBrokerProxy();
  registryUpdateBrokerProxy();

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
  };
};
