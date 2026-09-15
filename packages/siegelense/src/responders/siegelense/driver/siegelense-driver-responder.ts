/**
 * PURPOSE: The whole driver lifecycle for one instance, from its already-reserved registry row
 * through to the moment its lane is torn down. This is the ONE place `SiegelenseFlow`'s `driver`
 * route and `DriverFlow` (called by `StartSiegelenseDriver`) both converge — a responder, not a
 * broker, because it reads and writes `driverSessionState` through `DriverServeLayerResponder`, and
 * `flows/`/`startup/` cannot import `brokers/` at all (see `get-architecture`'s layer table), so the
 * whole sequence — read the row, resolve its spec, boot the lane, stamp the row, release
 * `boot.lock`, then serve — has to live at THIS layer regardless of which entry point reaches it.
 * The boot lock is released HERE and not by whichever broker reserved it, because the lock covers
 * the boot and the boot finishes inside the driver (siegelense-tooling.md line 1220).
 *
 * USAGE:
 * await SiegelenseDriverResponder({ instanceId: InstanceIdStub() });
 * // Boots the registry row's lane, stamps it, releases boot.lock, and blocks for the driver's life
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { bootLockReleaseBroker } from '../../../brokers/boot-lock/release/boot-lock-release-broker';
import { laneBootBroker } from '../../../brokers/lane/boot/lane-boot-broker';
import { laneSpecFindBroker } from '../../../brokers/lane-spec/find/lane-spec-find-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsInstanceHomePathFindBroker } from '../../../brokers/locations/instance-home-path-find/locations-instance-home-path-find-broker';
import { locationsSocketPathFindBroker } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryUpdateBroker } from '../../../brokers/registry/update/registry-update-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { DriverServeLayerResponder } from './driver-serve-layer-responder';

export const SiegelenseDriverResponder = async ({
  instanceId,
}: {
  instanceId: InstanceId;
}): Promise<AdapterResult> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((row) => row.id === instanceId);

  if (entry === undefined) {
    throw new Error(`SiegelenseDriverResponder: instance ${instanceId} not found in the registry`);
  }

  const spec = laneSpecFindBroker({ specName: entry.specName });
  const homePath = locationsInstanceHomePathFindBroker({ instanceId });
  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId,
    guildId: entry.guildId,
  });

  const lane = await laneBootBroker({
    spec,
    ports: entry.ports,
    instanceId,
    homePath,
    evidencePath,
  });

  const socketPath = locationsSocketPathFindBroker({ instanceId });

  await registryUpdateBroker({
    mutate: (current) => ({
      instances: current.instances.map((row) =>
        row.id === instanceId
          ? {
              ...row,
              bootedAtMs: epochMsContract.parse(Date.now()),
              pid: processIdContract.parse(String(process.pid)),
              pgids: lane.pgids,
              socketPath,
            }
          : row,
      ),
    }),
  });

  await bootLockReleaseBroker({ instanceId });

  return DriverServeLayerResponder({ instanceId, guildId: entry.guildId, lane });
};
