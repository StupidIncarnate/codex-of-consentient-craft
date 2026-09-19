/**
 * PURPOSE: The whole `capacity` call — what this machine can take right now, asked before opening a
 * pool (siegelense-tooling.md lines 2502-2515). Starts nothing: it reads the registry, the host and
 * the asset tree, which is why it is one of the ten calls that need no live instance (line 2275).
 * Reach for this over reading a profile and dividing at a call site — `suggested` inverts the
 * STAGGERED high-water mark, and a caller doing its own arithmetic against `peak × N` leaves
 * capacity unused while one against `steady × N` invites the OOM (line 1529).
 *
 * **It counts instances this session did not start** (line 1585). A parallel agent's lanes, a ward
 * e2e run holding a port pair, a developer's own browser: every one of them is a registry row, and
 * every registry row counts. A RESERVATION counts too — that is the thundering-herd cure at line
 * 225, where three sessions each divide free memory by peak and six boot.
 *
 * A row whose heartbeat has gone cold is EXCLUDED rather than reaped. Reaping is `cleanup`'s and
 * `start`'s, and a read that quietly killed things would make "ask before opening a pool" a
 * mutation. `isStaleRegistryEntryGuard` is what tells the two apart, on the same clock `start` uses.
 *
 * Reads run in sequence rather than through one `Promise.all`: `registryReadBroker` and
 * `machineReadBroker` each resolve their own paths through the shared `pathJoinAdapter` queue, and a
 * composing test stages them in the order the real calls consume them.
 *
 * USAGE:
 * await capacityReadBroker({ specName: null, poolSize: null });
 * // Returns the CapacityAnswer for the default spec against the policy ceiling's pool size
 */

import { capacityAnswerContract } from '../../../contracts/capacity-answer/capacity-answer-contract';
import type { CapacityAnswer } from '../../../contracts/capacity-answer/capacity-answer-contract';
import { capacityMeasuredContract } from '../../../contracts/capacity-measured/capacity-measured-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { profilePoolSizeContract } from '../../../contracts/profile-pool-size/profile-pool-size-contract';
import type { ProfilePoolSize } from '../../../contracts/profile-pool-size/profile-pool-size-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import { specNameContract } from '../../../contracts/spec-name/spec-name-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { capacityStatics } from '../../../statics/capacity/capacity-statics';
import { capacitySampleSelectTransformer } from '../../../transformers/capacity-sample-select/capacity-sample-select-transformer';
import { capacitySuggestTransformer } from '../../../transformers/capacity-suggest/capacity-suggest-transformer';
import { capacityWhyRenderTransformer } from '../../../transformers/capacity-why-render/capacity-why-render-transformer';
import { machineReadBroker } from '../../machine/read/machine-read-broker';
import { profileReadBroker } from '../../profile/read/profile-read-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';

const LOAD_AVERAGE_ONE_MINUTE = 0;

export const capacityReadBroker = async ({
  specName,
  poolSize,
}: {
  specName: SpecName | null;
  poolSize: ProfilePoolSize | null;
}): Promise<CapacityAnswer> => {
  const resolvedSpecName = specName ?? specNameContract.parse(capacityStatics.defaults.specName);
  // The pool a caller has not named is the largest one policy allows, so the group read is the most
  // CONTENDED the profile holds. Spec lines 1504-1507: a peak measured solo is optimistic for a pool
  // of three, and computing against the optimistic figure is the expensive mistake.
  const resolvedPoolSize =
    poolSize ?? profilePoolSizeContract.parse(capacityStatics.policy.ceiling);

  const registry = await registryReadBroker();
  const machine = await machineReadBroker();
  const specProfile = await profileReadBroker({ specName: resolvedSpecName });

  const nowMs = epochMsContract.parse(Date.now());
  const liveEntries = registry.instances.filter(
    (entry) => entry.state === 'alive' && !isStaleRegistryEntryGuard({ entry, nowMs }),
  );
  const siegeInstances = readingCountContract.parse(liveEntries.length);
  const reservedInstances = readingCountContract.parse(
    liveEntries.filter((entry) => isReservedRegistryEntryGuard({ entry })).length,
  );

  const profile = capacitySampleSelectTransformer({
    profile: specProfile,
    poolSize: resolvedPoolSize,
  });
  const suggestion = capacitySuggestTransformer({
    profile,
    freeMemMB: machine.freeMemMB,
    siegeInstances,
    reservedInstances,
  });

  return capacityAnswerContract.parse({
    suggested: suggestion.suggested,
    ceiling: suggestion.ceiling,
    why: capacityWhyRenderTransformer({
      specName: resolvedSpecName,
      profile,
      suggestion,
      freeMemMB: machine.freeMemMB,
      siegeInstances,
      reservedInstances,
    }),
    measured: capacityMeasuredContract.parse({
      freeMemMB: machine.freeMemMB,
      cores: machine.cores,
      loadAvg1: machine.loadAvg[LOAD_AVERAGE_ONE_MINUTE],
      siegeInstances,
      diskFreeMB: machine.freeDiskMB,
    }),
    profile,
  });
};
