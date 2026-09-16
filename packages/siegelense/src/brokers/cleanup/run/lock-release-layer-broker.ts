/**
 * PURPOSE: Releases `boot.lock` and `registry.lock` ONLY when each is stale by its own TTL
 * (`instanceLifecycleStatics.bootLock.ttlMs` / `.registryLock.ttlMs`) — never the holder-matching
 * release `bootLockReleaseBroker` performs for the instance that acquired its own lock.
 * `cleanupRunBroker` runs with no instance context of its own, so this answers "is this
 * operator-wide lock stuck", never "is this my lock to give back". A fresh lock is left alone: an
 * un-stale lock is still legitimately protecting a boot or a registry write in flight, and
 * releasing it would let a second one start alongside — the exact race both locks exist to
 * prevent. `nowMs` is a parameter, matching `isStaleRegistryEntryGuard`'s own convention, so this
 * stays pure against whatever single clock reading `cleanupRunBroker` took for its whole pass.
 *
 * USAGE:
 * await lockReleaseLayerBroker({ nowMs: EpochMsStub() });
 * // Both locks absent or fresh: { lockReleased: false }.
 * // Either past its own TTL: unlinks it, { lockReleased: true }.
 */

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { bootLockContract } from '../../../contracts/boot-lock/boot-lock-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { locationsBootLockPathFindBroker } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';

export const lockReleaseLayerBroker = async ({
  nowMs,
}: {
  nowMs: EpochMs;
}): Promise<{ lockReleased: boolean }> => {
  const bootLockPath = locationsBootLockPathFindBroker();
  let bootLockReleased = false;

  try {
    const bootLockContents = await fsReadFileAdapter({ filePath: bootLockPath });
    const { acquiredAtMs } = bootLockContract.parse(JSON.parse(bootLockContents));

    if (nowMs - acquiredAtMs > instanceLifecycleStatics.bootLock.ttlMs) {
      await fsUnlinkAdapter({ filePath: bootLockPath });
      bootLockReleased = true;
    }
  } catch (readError) {
    // This catch exists to classify exactly ONE thing: whether fsReadFileAdapter's OWN failure
    // means `boot.lock` is genuinely absent — the common case, since most machines have no boot in
    // flight. `readError` is usually this broker's own wrapping `new Error(...)`, safely
    // same-realm, but `.cause` is always a raw `fs/promises` rejection built by Node's own
    // internals outside Jest's vm realm, where `instanceof Error` reads false even though the
    // value genuinely is one — `errorIsNativeErrorAdapter` checks the V8-internal error slot
    // instead. Anything but ENOENT (a real read failure, a corrupt lock file) is rethrown
    // unchanged rather than silently read as "nothing to release".
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
  }

  const registryLockPath = locationsRegistryLockPathFindBroker();
  let registryLockReleased = false;

  try {
    // registryLockAcquireBroker writes this file as a bare millisecond string, never JSON — see
    // its own PURPOSE header.
    const registryLockContents = await fsReadFileAdapter({ filePath: registryLockPath });
    const acquiredAtMs = epochMsContract.parse(Number(registryLockContents));

    if (nowMs - acquiredAtMs > instanceLifecycleStatics.registryLock.ttlMs) {
      await fsUnlinkAdapter({ filePath: registryLockPath });
      registryLockReleased = true;
    }
  } catch (readError) {
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
  }

  return { lockReleased: bootLockReleased || registryLockReleased };
};
