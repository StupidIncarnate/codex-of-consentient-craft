/**
 * PURPOSE: Folds every instance's raw record into the `samples` array `profile` answers with —
 * **grouped by POOL SIZE, and never averaged across groups** (siegelense-tooling.md line 2526: a solo
 * sample and a contended one describe different worlds). Reach for this over doing the arithmetic
 * inside `profileReadBroker`: this is the one rule `capacity` depends on being right, and a pure
 * function is where it can be graded against two conditions at once with no filesystem in the way.
 *
 * `peakMB` takes the MAX across the runs in a group, never their mean — `capacity` divides free
 * memory by a ceiling, and a mean hides the run that would have OOMed. `steadyMB` pools every
 * settled BEAT in the group (`Σ steadySumMB / Σ steadyBeats`) rather than averaging each run's own
 * mean, so a long run and a short one contribute in proportion to what they actually measured. A
 * group whose runs were all killed inside the settle window has no settled beat at all, and falls
 * back to that group's peak — the only memory figure those runs produced, and honest about being an
 * overestimate rather than silently zero.
 *
 * USAGE:
 * profileSamplesGroupTransformer({ observations });
 * // Returns [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }, { poolSize: 3, … }]
 */

import type { ProfileObservation } from '../../contracts/profile-observation/profile-observation-contract';
import { specProfileContract } from '../../contracts/spec-profile/spec-profile-contract';
import type { SpecProfile } from '../../contracts/spec-profile/spec-profile-contract';

const samplesShape = specProfileContract.shape.samples;

export const profileSamplesGroupTransformer = ({
  observations,
}: {
  observations: readonly ProfileObservation[];
}): SpecProfile['samples'] => {
  const poolSizes = [
    ...new Set(observations.flatMap((observation) => observation.pools.map((p) => p.poolSize))),
  ].sort((left, right) => left - right);

  const samples = poolSizes.map((poolSize) => {
    const buckets = observations.flatMap((observation) =>
      observation.pools.filter((bucket) => bucket.poolSize === poolSize),
    );

    const peakMB = Math.max(...buckets.map((bucket) => bucket.peakMB));
    const steadySumMB = buckets.reduce((total, bucket) => total + bucket.steadySumMB, 0);
    const steadyBeats = buckets.reduce((total, bucket) => total + bucket.steadyBeats, 0);

    return {
      poolSize,
      steadyMB: steadyBeats === 0 ? peakMB : Math.floor(steadySumMB / steadyBeats),
      peakMB,
      runs: buckets.length,
    };
  });

  return samplesShape.parse(samples);
};
