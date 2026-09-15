/**
 * PURPOSE: The single read-modify-write path onto the registry, made safe across processes by a
 * short-lived exclusive lock (`registry.lock`) held for the whole cycle. Without it, two unrelated
 * sessions' reads can return the same snapshot, both mutates compute a next value against it, and
 * the second write silently replaces the first session's already-returned row — or two sessions'
 * port-pair candidates both look free against that shared snapshot and the registry ends up with
 * two rows claiming one pair. `registryLockAcquireBroker` closes that window with an OS-level
 * exclusive create; its TTL (`instanceLifecycleStatics.registryLock.ttlMs`) bounds how long a
 * SIGKILLed holder can wedge every other session's update, and its wait ceiling turns "held
 * forever" into a thrown error instead of an unbounded retry. `mutate` can throw deliberately
 * (`instanceReserveBroker`'s `PortClaimExhaustedError`), so the release runs in a `finally` — a
 * throw that skipped it would wedge the registry for every session after it.
 *
 * USAGE:
 * const registry = await registryUpdateBroker({
 *   mutate: (current) => ({ instances: [...current.instances, newEntry] }),
 * });
 * // Acquires registry.lock, reads the registry, applies mutate, writes the result, releases the
 * // lock, and returns it
 */

import type { Registry } from '../../../contracts/registry/registry-contract';
import { registryLockAcquireBroker } from '../lock-acquire/registry-lock-acquire-broker';
import { registryLockReleaseBroker } from '../lock-release/registry-lock-release-broker';
import { registryReadBroker } from '../read/registry-read-broker';
import { registryWriteBroker } from '../write/registry-write-broker';

export const registryUpdateBroker = async ({
  mutate,
}: {
  mutate: (current: Registry) => Registry;
}): Promise<Registry> => {
  await registryLockAcquireBroker({});

  try {
    const current = await registryReadBroker();
    const next = mutate(current);

    await registryWriteBroker({ registry: next });

    return next;
  } finally {
    await registryLockReleaseBroker();
  }
};
