/**
 * PURPOSE: Resolves an instance id to its SIX-WAY lifecycle state — `alive`, `killed`, `dead`,
 * `pruned`, `unknown` or `unusable` — the table `results` and `status` both key their answers on
 * (chunk-03-read-path-and-perception.md §3.C, the registry-row/heartbeat table). A registry row
 * absent from `registry.json` is `unknown`; a stored `pruned`, `killed` or `unusable` row is
 * answered verbatim — `unusable` needs no staleness check any more than `killed` does, since
 * `instanceRunBroker` is the only writer of that state and it never reverts one; a stored `alive`
 * row is checked against `isStaleRegistryEntryGuard` — the heartbeat, not the row's own claim, is
 * what tells an `alive` row apart from one nobody updated after a SIGKILL (`dead`) —
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

import { instanceStateResolveResultContract } from '../../../contracts/instance-state-resolve-result/instance-state-resolve-result-contract';
import type { InstanceStateResolveResult } from '../../../contracts/instance-state-resolve-result/instance-state-resolve-result-contract';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

export const instanceStateResolveBroker = async ({
  instanceId,
}: {
  instanceId: SiegeInstance['id'];
}): Promise<InstanceStateResolveResult> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((candidate) => candidate.id === instanceId) ?? null;

  if (entry === null) {
    return instanceStateResolveResultContract.parse({
      state: 'unknown',
      entry: null,
    });
  }

  if (entry.state === 'pruned') {
    return instanceStateResolveResultContract.parse({
      state: 'pruned',
      entry,
    });
  }

  if (entry.state === 'killed') {
    return instanceStateResolveResultContract.parse({
      state: 'killed',
      entry,
    });
  }

  if (entry.state === 'unusable') {
    return instanceStateResolveResultContract.parse({
      state: 'unusable',
      entry,
    });
  }

  const nowMs = Date.now();
  const isStale =
    isStaleRegistryEntryGuard({ entry, nowMs }) ||
    (isReservedRegistryEntryGuard({ entry }) &&
      nowMs - entry.reservedAtMs > instanceLifecycleStatics.reservation.staleAfterMs);

  return instanceStateResolveResultContract.parse({
    state: isStale ? 'dead' : 'alive',
    entry,
  });
};
