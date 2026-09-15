/**
 * PURPOSE: Marks a registry row `killed` and clears `pid`/`pgids`/`socketPath` — and NEVER deletes
 * it. A reaped entry survives as a TOMBSTONE for as long as its evidence directory does (spec lines
 * 288, 1666): `cleanup`, which any session may run at any moment, resolves "still referenced" off
 * the recorded row, so deleting it here would make a fixer's first lookup answer "unknown
 * instance" for a walk whose shots are sitting on disk. An empty answer reads as "that step
 * produced nothing" — the one conclusion a fixer must never draw from a missing file. "release"
 * reads like "delete"; it is not. `socketPath` is cleared alongside `pid` because a tombstone's
 * driver is gone — a stale path on a dead instance is worse than an honest null, since a caller that
 * trusted it would dial a socket nothing is listening on.
 *
 * USAGE:
 * await instanceReleaseBroker({ instanceId: InstanceIdStub() });
 * // Returns the same row, state: 'killed', pid: null, pgids: [], socketPath: null — still present
 * // in the registry
 */

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { registryEntryContract } from '../../../contracts/registry-entry/registry-entry-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';

export const instanceReleaseBroker = async ({
  instanceId,
}: {
  instanceId: InstanceId;
}): Promise<RegistryEntry> => {
  const updated = await registryUpdateBroker({
    mutate: (registry) => ({
      instances: registry.instances.map((entry) =>
        entry.id === instanceId
          ? registryEntryContract.parse({
              ...entry,
              state: 'killed',
              pid: null,
              pgids: [],
              socketPath: null,
            })
          : entry,
      ),
    }),
  });

  const released = updated.instances.find((entry) => entry.id === instanceId);

  if (released === undefined) {
    throw new Error(`Instance ${instanceId} not found in registry`);
  }

  return released;
};
