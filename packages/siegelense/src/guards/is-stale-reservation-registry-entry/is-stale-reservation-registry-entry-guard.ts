/**
 * PURPOSE: True for a RESERVATION (`isReservedRegistryEntryGuard`) whose `reservedAtMs` has outlived
 * `instanceLifecycleStatics.reservation.staleAfterMs` — the same ceiling `cleanupRunBroker` and
 * `instanceStateResolveBroker` already check inline, each as its own `isStaleRegistryEntryGuard ||
 * (isReservedRegistryEntryGuard && nowMs - reservedAtMs > staleAfterMs)` compound. Extracted here so
 * a THIRD and FOURTH reader (`capacityReadBroker`'s count, `instanceStartBroker`'s own `aheadOfMe`,
 * and `statusReadBroker`'s `--since` window) do not hand-roll a further copy of the same arithmetic.
 * `isStaleRegistryEntryGuard` itself deliberately returns `false` for `lastBeatMs === null` (its own
 * PURPOSE: a row that has never beaten is not the same as one whose beats stopped) — this guard is
 * the other half that check leaves uncovered, for the row shape a heartbeat check can never catch:
 * one that never got the chance to beat at all. `nowMs` is a PARAMETER, never `Date.now()` read
 * here, matching every other guard in this domain: this stays pure and the broker above it owns the
 * clock.
 *
 * USAGE:
 * isStaleReservationRegistryEntryGuard({
 *   entry: RegistryEntryStub({ bootedAtMs: null, reservedAtMs: EpochMsStub({ value: 0 }) }),
 *   nowMs: EpochMsStub(),
 * });
 * // Returns true once nowMs - reservedAtMs exceeds instanceLifecycleStatics.reservation.staleAfterMs
 */

import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { RegistryEntry } from '../../contracts/registry-entry/registry-entry-contract';
import { isReservedRegistryEntryGuard } from '../is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const isStaleReservationRegistryEntryGuard = ({
  entry,
  nowMs,
}: {
  entry?: RegistryEntry;
  nowMs?: EpochMs;
}): boolean => {
  if (!entry || nowMs === undefined) {
    return false;
  }

  if (!isReservedRegistryEntryGuard({ entry })) {
    return false;
  }

  return nowMs - entry.reservedAtMs > instanceLifecycleStatics.reservation.staleAfterMs;
};
