/**
 * PURPOSE: Resolves an instance id to its FIVE-WAY lifecycle state — `alive`, `killed`, `dead`,
 * `pruned` or `unknown` — the table `results` and `status` both key their answers on
 * (chunk-03-read-path-and-perception.md §3.C, the registry-row/heartbeat table). A registry row
 * absent from `registry.json` is `unknown`; a stored `pruned` or `killed` row is answered verbatim;
 * a stored `alive` row is checked against `isStaleRegistryEntryGuard` — the heartbeat, not the row's
 * own claim, is what tells an `alive` row apart from one nobody updated after a SIGKILL (`dead`) —
 * OR, for a row that has never beaten at all, against how long it has sat RESERVED
 * (`isReservedRegistryEntryGuard` plus `instanceLifecycleStatics.reservation.staleAfterMs`): a
 * reservation seconds old is a boot in flight and reads `alive`, but one that has outlived every
 * legitimate reason to still lack a beat reads `dead` rather than the `alive` its own row still
 * claims — the same ceiling `cleanupRunBroker` uses to decide whether to reap it. Reach for this
 * over reading `registryReadBroker` directly wherever a caller needs the RESOLVED state rather
 * than the raw row.
 *
 * USAGE:
 * const { state, entry } = await instanceStateResolveBroker({ instanceId });
 * // state: 'dead', entry: the stale registry row — entry is null only when state is 'unknown'
 */

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { instanceStateContract } from '../../../contracts/instance-state/instance-state-contract';
import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { registryReadBroker } from '../../registry/read/registry-read-broker';

export const instanceStateResolveBroker = async ({
  instanceId,
}: {
  instanceId: InstanceId;
}): Promise<{ state: InstanceState; entry: RegistryEntry | null }> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((candidate) => candidate.id === instanceId) ?? null;

  if (entry === null) {
    return { state: instanceStateContract.parse('unknown'), entry: null };
  }

  if (entry.state === 'pruned') {
    return { state: instanceStateContract.parse('pruned'), entry };
  }

  if (entry.state === 'killed') {
    return { state: instanceStateContract.parse('killed'), entry };
  }

  const nowMs = epochMsContract.parse(Date.now());
  const isStale =
    isStaleRegistryEntryGuard({ entry, nowMs }) ||
    (isReservedRegistryEntryGuard({ entry }) &&
      nowMs - entry.reservedAtMs > instanceLifecycleStatics.reservation.staleAfterMs);

  return { state: instanceStateContract.parse(isStale ? 'dead' : 'alive'), entry };
};
