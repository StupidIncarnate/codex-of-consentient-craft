/**
 * PURPOSE: Releases `registry.lock` once the read-mutate-write it gated has finished — on every
 * exit path, including a thrown `mutate`, since `instanceReserveBroker`'s mutate deliberately
 * throws `PortClaimExhaustedError` and a lock left held by that throw wedges every other session's
 * next `registryUpdateBroker` call. Unlike `bootLockReleaseBroker`, this never reads the file back
 * to check who currently holds it: the whole acquire-use-release cycle lives inside one
 * `registryUpdateBroker` call, so nothing else can have legitimately taken the lock over by the
 * time this runs unless this call's own hold outran the TTL — the risk
 * `instanceLifecycleStatics.registryLock.ttlMs` is sized to make vanishingly unlikely for an
 * operation this short.
 *
 * USAGE:
 * await registryLockReleaseBroker();
 * // Removes registry.lock, returns { success: true }
 */

import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const registryLockReleaseBroker = async (): Promise<AdapterResult> => {
  const lockPath = locationsRegistryLockPathFindBroker();

  return fsUnlinkAdapter({ filePath: lockPath });
};
