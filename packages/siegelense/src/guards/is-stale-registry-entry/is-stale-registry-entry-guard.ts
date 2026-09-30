/**
 * PURPOSE: True when `lastBeatMs` is older than `heartbeat.intervalMs × heartbeat.stalenessBeats`
 * — the cure for reaping-by-staleness (spec line 189: any session may reap an instance whose
 * heartbeat has gone cold, because a cold heartbeat is a fact anyone can check). `nowMs` is a
 * PARAMETER, never `Date.now()` read here, so this stays pure and the broker above it owns the
 * clock.
 *
 * `lastBeatMs: null` means NOT STALE (returns false) — a row that has never beaten (freshly
 * reserved, still booting) is not the same as a row whose beats stopped. Booting takes real time
 * (~20s per the boot-lock statics), so treating an unbeaten reservation as maximally stale would
 * let a staleness reaper kill a boot in progress before its first heartbeat ever lands. Staleness
 * measures beats that WENT COLD, not beats that never started.
 *
 * USAGE:
 * isStaleRegistryEntryGuard({ entry: RegistryEntryStub({ lastBeatMs: 0 }), nowMs: 1_700_000_000_000 });
 * // Returns true once nowMs - lastBeatMs exceeds intervalMs * stalenessBeats
 */

import type { RegistryEntry } from '../../contracts/registry-entry/registry-entry-contract';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const isStaleRegistryEntryGuard = ({
  entry,
  nowMs,
}: {
  entry?: RegistryEntry;
  nowMs?: number;
}): boolean => {
  if (!entry || nowMs === undefined) {
    return false;
  }

  if (entry.lastBeatMs === null) {
    return false;
  }

  const stalenessThresholdMs =
    instanceLifecycleStatics.heartbeat.intervalMs *
    instanceLifecycleStatics.heartbeat.stalenessBeats;

  return nowMs - entry.lastBeatMs > stalenessThresholdMs;
};
