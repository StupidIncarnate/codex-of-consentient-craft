/**
 * PURPOSE: True for a RESERVATION row — `bootedAtMs === null` — never a sixth `InstanceState`.
 * The five `InstanceState` members (spec lines 2175-2181) are the closed set `results` answers
 * with; a reservation is still `state: 'alive'`, just not booted yet. `instance-reserve-broker`
 * writes exactly this shape, and `capacity` reads this guard to count a reservation as taken
 * before any process exists — the cure for three sessions each dividing free memory by peak and
 * six booting at once (spec line 185).
 *
 * USAGE:
 * isReservedRegistryEntryGuard({ entry: RegistryEntryStub({ bootedAtMs: null }) });
 * // Returns true
 */

import type { RegistryEntry } from '../../contracts/registry-entry/registry-entry-contract';

export const isReservedRegistryEntryGuard = ({ entry }: { entry?: RegistryEntry }): boolean => {
  if (!entry) {
    return false;
  }

  return entry.bootedAtMs === null;
};
