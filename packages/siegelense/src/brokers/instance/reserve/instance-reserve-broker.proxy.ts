import { createServer, type Server } from 'net';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { fsMkdirAdapterProxy, netFreePortPairAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, NetworkPort } from '@dungeonmaster/shared/contracts';

import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';

const UUID_VALUE = '7f3a9c21-58cc-4372-a567-0e02b2c3d479';
const NOW_MS_VALUE = 1_700_000_000_000;

const buildFakePortServer = ({ port }: { port: NetworkPort }): Server =>
  ({
    listen: (_listenPort: number, callback: () => void): void => {
      callback();
    },
    close: (callback: () => void): void => {
      callback();
    },
    address: (): { port: NetworkPort } => ({ port }),
    on: (): undefined => undefined,
  }) as unknown as Server;

export const instanceReserveBrokerProxy = (): {
  mintedInstanceId: () => ReturnType<typeof InstanceIdStub>;
  mintedReservedAtMs: () => ReturnType<typeof EpochMsStub>;
  setupRegistry: (params: { json: string }) => void;
  setupRegistryForExhaustedClaim: (params: { json: string }) => void;
  setupEvidenceDir: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  // Stages the OS's answer for every port-claim candidate this broker asks for, in call order —
  // this broker asks for `claimAttempts` pairs UPFRONT (they don't depend on each other), so
  // every scenario stages exactly that many pairs; a scenario needing fewer real candidates
  // repeats its last (uncontested) pair for the remainder.
  setupPortCandidates: (params: {
    pairs: readonly { api: NetworkPort; web: NetworkPort }[];
  }) => void;
  getWrittenRegistry: () => unknown;
  getCreatedDirs: () => readonly unknown[];
} => {
  const updateProxy = registryUpdateBrokerProxy();
  const evidenceProxy = locationsInstanceEvidencePathFindBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  netFreePortPairAdapterProxy();

  const createServerHandle = registerMock({ fn: createServer });

  registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(UUID_VALUE);
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(NOW_MS_VALUE);

  return {
    mintedInstanceId: (): ReturnType<typeof InstanceIdStub> =>
      InstanceIdStub({ value: `inst_${UUID_VALUE.split('-').join('')}` }),

    mintedReservedAtMs: (): ReturnType<typeof EpochMsStub> => EpochMsStub({ value: NOW_MS_VALUE }),

    setupRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
    },

    // registryUpdateBroker's mutate throws PortClaimExhaustedError when every candidate pair
    // collides, before registryWriteBroker is ever reached — so this stages no write path
    // resolution at all, matching the broker's real call order (acquire, read, release).
    setupRegistryForExhaustedClaim: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistryForThrowingMutate({ json });
    },

    setupEvidenceDir: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
    }): void => {
      evidenceProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });
      mkdirProxy.succeeds({ filepath: evidencePath });
    },

    setupPortCandidates: ({
      pairs,
    }: {
      pairs: readonly { api: NetworkPort; web: NetworkPort }[];
    }): void => {
      pairs.forEach(({ api, web }) => {
        createServerHandle.onceFor([]).returns(buildFakePortServer({ port: api }));
        createServerHandle.onceFor([]).returns(buildFakePortServer({ port: web }));
      });
    },

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
