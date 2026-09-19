/**
 * PURPOSE: Folds ONE measured beat into the instance's profile record — the whole settle rule and
 * the whole bucket-picking rule, in one pure place the sampler broker can be graded against without
 * a filesystem. Reach for this over writing the arithmetic inside `profileSampleRecordBroker`: the
 * broker owns reading and writing the file, this owns what the numbers become, and the
 * never-blend-two-conditions invariant (siegelense-tooling.md line 1489) is a rule about numbers.
 *
 * A beat always raises PEAK. It reaches STEADY only once `profileStatics.settle.afterMs` has passed
 * since this record's FIRST beat — "what it settles at" is not the first reading taken. A beat at a
 * pool size the record has never seen opens a SECOND bucket rather than merging into the existing
 * one: the pool can grow mid-run, and folding a contended reading into a solo bucket is the averaging
 * the design forbids, one level below the answer.
 *
 * USAGE:
 * profileObservationMergeTransformer({
 *   observation: null,
 *   instanceId, specHash, poolSize, rssMB, beatAtMs,
 * });
 * // Returns the opening ProfileObservation — one bucket, peak set, no steady beat yet
 */

import type { Megabytes } from '../../contracts/megabytes/megabytes-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../contracts/instance-id/instance-id-contract';
import { profileObservationContract } from '../../contracts/profile-observation/profile-observation-contract';
import type { ProfileObservation } from '../../contracts/profile-observation/profile-observation-contract';
import type { ProfilePoolSize } from '../../contracts/profile-pool-size/profile-pool-size-contract';
import type { SpecHash } from '../../contracts/spec-hash/spec-hash-contract';
import { profileStatics } from '../../statics/profile/profile-statics';

export const profileObservationMergeTransformer = ({
  observation,
  instanceId,
  specHash,
  poolSize,
  rssMB,
  beatAtMs,
}: {
  observation: ProfileObservation | null;
  instanceId: InstanceId;
  specHash: SpecHash;
  poolSize: ProfilePoolSize;
  rssMB: Megabytes;
  beatAtMs: EpochMs;
}): ProfileObservation => {
  const firstBeatAtMs = observation === null ? beatAtMs : observation.firstBeatAtMs;
  const isSettled = beatAtMs - firstBeatAtMs >= profileStatics.settle.afterMs;
  const existingPools = observation === null ? [] : observation.pools;
  const matched = existingPools.find((bucket) => bucket.poolSize === poolSize);

  const mergedBucket =
    matched === undefined
      ? {
          poolSize,
          peakMB: rssMB,
          steadySumMB: isSettled ? rssMB : 0,
          steadyBeats: isSettled ? 1 : 0,
        }
      : {
          poolSize,
          peakMB: Math.max(matched.peakMB, rssMB),
          steadySumMB: isSettled ? matched.steadySumMB + rssMB : matched.steadySumMB,
          steadyBeats: isSettled ? matched.steadyBeats + 1 : matched.steadyBeats,
        };

  const pools = [
    ...existingPools.filter((bucket) => bucket.poolSize !== poolSize),
    mergedBucket,
  ].sort((left, right) => left.poolSize - right.poolSize);

  return profileObservationContract.parse({
    instanceId,
    specHash,
    firstBeatAtMs,
    measuredAtMs: beatAtMs,
    pools,
  });
};
