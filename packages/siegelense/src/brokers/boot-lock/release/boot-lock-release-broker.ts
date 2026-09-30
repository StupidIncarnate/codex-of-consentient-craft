/**
 * PURPOSE: Releases `boot.lock` once this instance's boot has finished, but ONLY when the lock on
 * disk is still stamped with this instance — a lock another instance took over after a staleness
 * release belongs to that instance now, and deleting it out from under a live holder is how two
 * instances end up booting together (the exact race `bootLockAcquireBroker` exists to prevent).
 * Returns nothing: neither path has a value to report.
 *
 * USAGE:
 * await bootLockReleaseBroker({ instanceId: InstanceIdStub() });
 * // This instance's lock: removes boot.lock.
 * // No lock, or another instance's lock: leaves the file alone.
 */

import { readFileIfExists, unlink } from '#gateway/node/fs__promises';
import { locationsBootLockPathFindBroker } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker';
import { bootLockContract } from '../../../contracts/boot-lock/boot-lock-contract';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const bootLockReleaseBroker = async ({
  instanceId,
}: {
  instanceId: SiegeInstance['id'];
}): Promise<void> => {
  const bootLockPath = locationsBootLockPathFindBroker();

  const existingContents = await readFileIfExists(bootLockPath);

  if (existingContents === null) {
    return;
  }

  const existingLock = bootLockContract.parse(JSON.parse(existingContents));

  if (existingLock.heldBy !== instanceId) {
    return;
  }

  await unlink(bootLockPath);
};
