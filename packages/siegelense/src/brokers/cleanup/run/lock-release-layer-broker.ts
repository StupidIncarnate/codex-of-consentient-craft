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
 * await lockReleaseLayerBroker({ nowMs: 1_700_000_000_000 });
 * // Both locks absent or fresh: { lockReleaseOutcome: 'none-held' }.
 * // Either past its own TTL: unlinks it, { lockReleaseOutcome: 'released' }.
 * // If unlinking a stale lock throws: { lockReleaseOutcome: 'failed' }.
 */

import { readFileIfExists, unlink } from '#gateway/node/fs__promises';
import { bootLockContract } from '../../../contracts/boot-lock/boot-lock-contract';
import type { LockReleaseOutcome } from '../../../contracts/lock-release-outcome/lock-release-outcome-contract';
import { locationsBootLockPathFindBroker } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';

export const lockReleaseLayerBroker = async ({
  nowMs,
}: {
  nowMs: number;
}): Promise<{ lockReleaseOutcome: LockReleaseOutcome }> => {
  const bootLockPath = locationsBootLockPathFindBroker();
  let anyReleased = false;
  let anyFailed = false;

  const bootLockContents = await readFileIfExists(bootLockPath);
  if (bootLockContents !== null) {
    const { acquiredAtMs } = bootLockContract.parse(JSON.parse(bootLockContents));

    if (nowMs - acquiredAtMs > instanceLifecycleStatics.bootLock.ttlMs) {
      try {
        await unlink(bootLockPath);
        anyReleased = true;
      } catch {
        anyFailed = true;
      }
    }
  }

  const registryLockPath = locationsRegistryLockPathFindBroker();

  // registryLockAcquireBroker writes this file as a bare millisecond string, never JSON — see
  // its own PURPOSE header.
  const registryLockContents = await readFileIfExists(registryLockPath);
  if (registryLockContents !== null) {
    const acquiredAtMs = Number(registryLockContents);

    if (nowMs - acquiredAtMs > instanceLifecycleStatics.registryLock.ttlMs) {
      try {
        await unlink(registryLockPath);
        anyReleased = true;
      } catch {
        anyFailed = true;
      }
    }
  }

  if (anyFailed) {
    return { lockReleaseOutcome: 'failed' };
  }

  if (anyReleased) {
    return { lockReleaseOutcome: 'released' };
  }

  return { lockReleaseOutcome: 'none-held' };
};
