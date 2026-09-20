/**
 * PURPOSE: Picks the ONE measured sample group `capacity` divides by, and shapes it into the answer's
 * `profile` block. This is where siegelense-tooling.md line 2526 is enforced — a solo sample and a
 * contended one describe different worlds, so the group matching the pool about to be opened is
 * SELECTED and never averaged with its neighbours. Reach for this over reading `profile.samples`
 * at a call site: a caller that means well still blends, and a blend is wrong in a direction nobody
 * can see (line 1489).
 *
 * The rule, in order: the largest group measured at or below the requested pool; failing that (every
 * group measured a bigger pool than the caller is opening) the smallest group there is, because an
 * over-contended figure is pessimistic and pessimism is the safe direction here (line 1527); failing
 * that, `null` — a spec nothing has ever run, which the suggestion transformer answers with the
 * default pair rather than a fabricated number.
 *
 * `fromRuns` is the chosen GROUP's own run count, not the profile's total across every group. The
 * spec's illustrative block pairs one group's memory figures with the total (line 1575); reporting
 * 14 runs beside a figure nine of them produced is the same blend this transformer exists to
 * prevent.
 *
 * USAGE:
 * capacitySampleSelectTransformer({ profile, poolSize: ProfilePoolSizeStub({ value: 3 }) });
 * // Returns the pool-size-3 group as a CapacityProfile, or null when the spec has no samples
 */

import { capacityProfileContract } from '../../contracts/capacity-profile/capacity-profile-contract';
import type { CapacityProfile } from '../../contracts/capacity-profile/capacity-profile-contract';
import type { ProfilePoolSize } from '../../contracts/profile-pool-size/profile-pool-size-contract';
import type { SpecProfile } from '../../contracts/spec-profile/spec-profile-contract';

export const capacitySampleSelectTransformer = ({
  profile,
  poolSize,
}: {
  profile: SpecProfile;
  poolSize: ProfilePoolSize;
}): CapacityProfile | null => {
  const ascending = [...profile.samples].sort((left, right) => left.poolSize - right.poolSize);
  const atOrBelow = ascending.filter((sample) => sample.poolSize <= poolSize);
  const chosen = atOrBelow.at(-1) ?? ascending.at(0);

  if (chosen === undefined) {
    return null;
  }

  return capacityProfileContract.parse({
    spec: profile.specName,
    poolSize: chosen.poolSize,
    steadyMB: chosen.steadyMB,
    peakMB: chosen.peakMB,
    fromRuns: chosen.runs,
  });
};
