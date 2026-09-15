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

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
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

  try {
    const existingContents = await fsReadFileAdapter({ filePath: bootLockPath });
    const parsedLockJson: unknown = JSON.parse(existingContents);
    const existingLock = bootLockContract.parse(parsedLockJson);

    if (existingLock.heldBy !== instanceId) {
      return { success: true as const };
    }

    return await fsUnlinkAdapter({ filePath: bootLockPath });
  } catch (readError) {
    // This catch exists to classify exactly ONE thing: whether fsReadFileAdapter's OWN failure
    // means `boot.lock` is genuinely absent. fsReadFileAdapter wraps every failure in a generic
    // Error with the original as `cause`, so the code the OS actually raised sits one level down.
    // ENOENT alone means there genuinely is no lock to release — already the answer this call is
    // after. Every other error reaching here — a real read failure (EMFILE while this instance's
    // own boot starves file descriptors, a transient EACCES, an ESTALE handle on a networked
    // home), a corrupt lock file, or a rejection from the unlink above — fails this shape check
    // and is rethrown UNCHANGED, so this branch is a no-op for anything that did not originate as
    // an absence at the read itself. Treating a real failure as absence reports success without
    // unlinking: the lock may still genuinely be held by this instance, and a caller told
    // "released" when it is not queues the next boot behind a lock nobody is protecting anymore,
    // with no signal that anything went wrong. `readError` is usually this broker's own wrapping
    // `new Error(...)` from fsReadFileAdapter, safely same-realm, but `.cause` is always a raw
    // `fs/promises` rejection built by Node's own internals outside Jest's vm realm, where
    // `instanceof Error` reads false even though the value genuinely is one —
    // `errorIsNativeErrorAdapter` checks the V8-internal error slot instead. The null/typeof
    // checks ahead of each adapter call are what let the later property accesses typecheck.
    if (
      readError === null ||
      typeof readError !== 'object' ||
      !errorIsNativeErrorAdapter({ value: readError }) ||
      !('cause' in readError) ||
      readError.cause === null ||
      typeof readError.cause !== 'object' ||
      !errorIsNativeErrorAdapter({ value: readError.cause }) ||
      !('code' in readError.cause) ||
      readError.cause.code !== 'ENOENT'
    ) {
      throw readError;
    }

    return { success: true as const };
  }
};
