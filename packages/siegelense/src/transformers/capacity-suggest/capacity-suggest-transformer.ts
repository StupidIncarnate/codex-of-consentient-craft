/**
 * PURPOSE: The whole of `capacity`'s arithmetic, as one pure function — the inversion of the
 * STAGGERED high-water mark `steady × (N−1) + peak` (siegelense-tooling.md line 1524), clamped to
 * the policy ceiling and to what the CPU can absorb. Reach for this over dividing free memory by
 * peak at a call site: computing against `peak × N` under-provisions a staggered pool and leaves
 * capacity unused, and computing against `steady × N` over-provisions and invites the OOM the whole
 * section exists to avoid (line 1529).
 *
 * A BOOTED instance's memory is already missing from `freeMemMB`, so it is never debited twice —
 * it costs only its slot under the ceiling. A RESERVATION has claimed a port pair and is about to
 * pay its peak but has not yet, so its peak IS debited: that is the thundering-herd cure at line
 * 225, where three sessions each divide free memory by peak, each concludes it can start two, and
 * six boot.
 *
 * `cpuAllows` is spare cores — `cores − loadAvg1`, floored — clamped to never drop below
 * `capacityStatics.cpu.minAllowed`. A host well past saturated (load 33.56 across 12 cores) still
 * gets that floor rather than 0: unlike memory, which has a real "cannot hold one more" zero, a
 * busy CPU is back-pressure, and a formula that let it reach zero would starve a working-but-loaded
 * host forever instead of slowing it down. `suggested` is the minimum of `memoryAllows`,
 * `cpuAllows` and `ceilingLeft`, so whichever is tightest governs, and each stays in the answer
 * separately so the `why` can name which one it was.
 *
 * With no measured group, `suggested` falls back to `capacityStatics.noProfile.suggested` — the
 * pair that profiles itself (line 1517) — and `memoryAllows` takes that same value rather than
 * zero, because nothing was measured and `start`'s memory refusal must not fire on an absence.
 * `cpuAllows` is computed the same way regardless of whether a profile exists: CPU pressure is a
 * property of the HOST, not the spec.
 *
 * USAGE:
 * capacitySuggestTransformer({ profile, freeMemMB, siegeInstances, reservedInstances, cores, loadAvg1 });
 * // Returns { suggested, ceiling, memoryAllows, cpuAllows, ceilingLeft, availableMB }
 */

import type { CapacityMeasured } from '../../contracts/capacity-measured/capacity-measured-contract';
import type { CapacityProfile } from '../../contracts/capacity-profile/capacity-profile-contract';
import { capacitySuggestionContract } from '../../contracts/capacity-suggestion/capacity-suggestion-contract';
import type { CapacitySuggestion } from '../../contracts/capacity-suggestion/capacity-suggestion-contract';
import type { Megabytes } from '../../contracts/megabytes/megabytes-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';
import { capacityStatics } from '../../statics/capacity/capacity-statics';

// A group whose every run was killed inside the settle window falls back to that group's peak, and
// a peak of zero is a legal Megabytes — dividing by it yields Infinity or NaN, neither of which is
// an instance count. One megabyte is the smallest divisor that keeps the arithmetic an integer.
const MIN_STEADY_DIVISOR_MB = 1;
const INSTANCE_CURRENTLY_BOOTING = 1;

export const capacitySuggestTransformer = ({
  profile,
  freeMemMB,
  siegeInstances,
  reservedInstances,
  cores,
  loadAvg1,
}: {
  profile: CapacityProfile | null;
  freeMemMB: Megabytes;
  siegeInstances: ReadingCount;
  reservedInstances: ReadingCount;
  cores: ReadingCount;
  loadAvg1: CapacityMeasured['loadAvg1'];
}): CapacitySuggestion => {
  const { ceiling } = capacityStatics.policy;
  const ceilingLeft = Math.max(0, ceiling - siegeInstances);
  const cpuAllows = Math.max(capacityStatics.cpu.minAllowed, Math.floor(cores - loadAvg1));

  if (profile === null) {
    return capacitySuggestionContract.parse({
      suggested: Math.min(capacityStatics.noProfile.suggested, cpuAllows, ceilingLeft),
      ceiling,
      memoryAllows: capacityStatics.noProfile.suggested,
      cpuAllows,
      ceilingLeft,
      availableMB: Math.max(0, freeMemMB - capacityStatics.memory.headroomMB),
    });
  }

  const availableMB = Math.max(
    0,
    freeMemMB - capacityStatics.memory.headroomMB - profile.peakMB * reservedInstances,
  );
  const steadyDivisorMB = Math.max(profile.steadyMB, MIN_STEADY_DIVISOR_MB);

  // The inversion: the pool's high-water mark is steady × (N−1) + peak, so the largest N that fits
  // under availableMB is floor((availableMB − peak) / steady) + 1 — the +1 being the one instance
  // currently at its peak while every other has settled.
  const memoryAllows =
    availableMB < profile.peakMB
      ? 0
      : Math.floor((availableMB - profile.peakMB) / steadyDivisorMB) + INSTANCE_CURRENTLY_BOOTING;

  return capacitySuggestionContract.parse({
    suggested: Math.min(memoryAllows, cpuAllows, ceilingLeft),
    ceiling,
    memoryAllows,
    cpuAllows,
    ceilingLeft,
    availableMB,
  });
};
