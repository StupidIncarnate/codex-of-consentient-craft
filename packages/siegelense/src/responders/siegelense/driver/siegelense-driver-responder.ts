/**
 * PURPOSE: The whole driver lifecycle for one instance, from its already-reserved registry row
 * through to the moment its lane is torn down. This is the ONE place `SiegelenseFlow`'s `driver`
 * route and `DriverFlow` (called by `StartSiegelenseDriver`) both converge — a responder, not a
 * broker, because it reads and writes `driverSessionState` through `DriverServeLayerResponder`, and
 * `flows/`/`startup/` cannot import `brokers/` at all (see `get-architecture`'s layer table), so the
 * whole sequence — read the row, resolve its spec, boot the lane, stamp the row, release
 * `boot.lock`, then serve — has to live at THIS layer regardless of which entry point reaches it.
 * The boot lock is released HERE and not by whichever broker reserved it, because the lock covers
 * the boot and the boot finishes inside the driver (siegelense-tooling.md line 1220). `laneBootBroker`
 * is wrapped in its own try/catch: it can throw `LaneBootFailedError` when a process never opens its
 * port, and this process is about to exit either way, so `boot.lock` is released on that path too rather
 * than only on success — otherwise it stays held until the TTL expires on top of the calling
 * `instanceStartBroker` already burning its own full poll deadline against a socket this process
 * never opens (spec line 1501). That same catch also writes `boot-failure.json` beside the evidence
 * before rethrowing — the failure marker `instanceStartBootPollLayerBroker` checks on every failed
 * ping from the OTHER process, so that caller learns THIS error's own message within one poll
 * interval instead of only after its full deadline elapses.
 *
 * USAGE:
 * await SiegelenseDriverResponder({ instanceId: InstanceIdStub() });
 * // Boots the registry row's lane, stamps it, releases boot.lock, and blocks for the driver's life
 * // A boot failure writes boot-failure.json, releases boot.lock, and rethrows without stamping the
 * // registry or serving
 *
 * await SiegelenseDriverResponder({ instanceId: InstanceIdStub(), idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }) });
 * // Same, but the served lane reaps itself after 1_800_000ms of no traffic instead of the default
 */

import { contentTextContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, TimeoutMs } from '@dungeonmaster/shared/contracts';

import { bootFailureMarkerWriteBroker } from '../../../brokers/boot-failure-marker/write/boot-failure-marker-write-broker';
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
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { DriverServeLayerResponder } from './driver-serve-layer-responder';

export const SiegelenseDriverResponder = async ({
  instanceId,
  idleTimeoutMs,
}: {
  instanceId: InstanceId;
  idleTimeoutMs?: TimeoutMs;
}): Promise<AdapterResult> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((row) => row.id === instanceId);

  if (entry === undefined) {
    throw new Error(`SiegelenseDriverResponder: instance ${instanceId} not found in the registry`);
  }

  const spec = await laneSpecFindBroker({ specName: entry.specName });
  const homePath = locationsInstanceHomePathFindBroker({ instanceId });
  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId,
    guildId: entry.guildId,
  });

  // `laneBootBroker` can throw `LaneBootFailedError` (unready past `bootTimeoutMs`) — this process
  // is about to exit either way, and `bootLockReleaseBroker` below is otherwise only reached on a
  // SUCCESSFUL boot. Left
  // unreleased, the lock wedges every other pending boot until instanceLifecycleStatics' TTL
  // expires, on top of the calling `instanceStartBroker` already burning the full
  // `driverStatics.boot.defaultTimeoutMs` polling a socket this process never opens (spec line
  // 1501). Releasing here, matching instanceStartBroker's own catch-and-release shape, at least
  // frees a QUEUED sibling boot immediately rather than making it wait out this one's dead poll
  // window too.
  const lane: LaneSession = await (async (): Promise<LaneSession> => {
    try {
      return await laneBootBroker({
        spec,
        ports: entry.ports,
        instanceId,
        homePath,
        evidencePath,
      });
    } catch (bootError) {
      await bootLockReleaseBroker({ instanceId });

      // Written BEFORE this process exits, so a caller polling this instance's socket from a
      // DIFFERENT process — `instanceStartBootPollLayerBroker`, burning the boot deadline against a
      // connection this process never opens — has a machine-readable place to learn WHY, rather
      // than reading a bare refused connection as "still launching" for the full timeout. Wrapped so
      // a throw HERE (a disk full, an unwritable evidence dir) can never replace `bootError` — the
      // boot failure is what the caller needs to see, whether or not the marker write itself lands.
      try {
        await bootFailureMarkerWriteBroker({
          evidencePath,
          message: contentTextContract.parse(
            bootError instanceof Error ? bootError.message : String(bootError),
          ),
        });
      } catch (markerWriteError: unknown) {
        process.stderr.write(
          `SiegelenseDriverResponder: writing the boot-failure marker for ${instanceId} failed: ${String(markerWriteError)}\n`,
        );
      }

      throw bootError;
    }
  })();

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

  return DriverServeLayerResponder(
    idleTimeoutMs === undefined
      ? { instanceId, guildId: entry.guildId, lane }
      : { instanceId, guildId: entry.guildId, lane, idleTimeoutMs },
  );
};
