/**
 * PURPOSE: Releases `boot.lock` once this instance's boot has finished, but ONLY when the lock on
 * disk is still stamped with this instance — a lock another instance took over after a staleness
 * release belongs to that instance now, and deleting it out from under a live holder is how two
 * instances end up booting together (the exact race `bootLockAcquireBroker` exists to prevent).
 * `enforce-folder-return-types` refuses `Promise<void>` on a broker, so this returns the same
 * `AdapterResult` shape the fs adapters do.
 *
 * USAGE:
 * await bootLockReleaseBroker({ instanceId: InstanceIdStub() });
 * // This instance's lock: removes boot.lock, returns { success: true }.
 * // No lock, or another instance's lock: leaves the file alone, returns { success: true }.
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { locationsBootLockPathFindBroker } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker';
import { bootLockContract } from '../../../contracts/boot-lock/boot-lock-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const bootLockReleaseBroker = async ({
  instanceId,
}: {
  instanceId: InstanceId;
}): Promise<AdapterResult> => {
  const bootLockPath = locationsBootLockPathFindBroker();

  const existingContents = await readFileIfExists(bootLockPath);

  if (existingContents === null) {
    return { success: true };
  }

  const existingLock = bootLockContract.parse(JSON.parse(existingContents));

  if (existingLock.heldBy !== instanceId) {
    return { success: true };
  }

  return fsUnlinkAdapter({ filePath: bootLockPath });
};
