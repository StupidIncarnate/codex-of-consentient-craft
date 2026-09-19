import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { MegabytesStub } from '../../contracts/megabytes/megabytes.stub';
import { ProfileObservationStub } from '../../contracts/profile-observation/profile-observation.stub';
import { ProfilePoolSizeStub } from '../../contracts/profile-pool-size/profile-pool-size.stub';
import { SpecHashStub } from '../../contracts/spec-hash/spec-hash.stub';
import { profileStatics } from '../../statics/profile/profile-statics';

import { profileObservationMergeTransformer } from './profile-observation-merge-transformer';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const SPEC_HASH = SpecHashStub({ value: 'a3f9c2e1' });
const FIRST_BEAT_MS = 1_700_000_000_000;

describe('profileObservationMergeTransformer', () => {
  describe('the first beat of a run', () => {
    it('EMPTY: {observation: null} => opens the record with one bucket, peak set and no steady beat', () => {
      const result = profileObservationMergeTransformer({
        observation: null,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
        rssMB: MegabytesStub({ value: 2600 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
      });
    });
  });

  describe('a beat inside the settle window', () => {
    it('VALID: {a higher reading one second in} => raises peak and still adds no steady beat', () => {
      const observation = ProfileObservationStub({
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
      });

      const result = profileObservationMergeTransformer({
        observation,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
        rssMB: MegabytesStub({ value: 2900 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + 1000 }),
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + 1000,
        pools: [{ poolSize: 1, peakMB: 2900, steadySumMB: 0, steadyBeats: 0 }],
      });
    });

    it('VALID: {a lower reading one second in} => leaves peak where it was', () => {
      const observation = ProfileObservationStub({
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
      });

      const result = profileObservationMergeTransformer({
        observation,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
        rssMB: MegabytesStub({ value: 1800 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + 1000 }),
      });

      expect(result.pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 },
      ]);
    });
  });

  describe('a beat past the settle window', () => {
    it('VALID: {a reading at the settle boundary} => counts toward steady', () => {
      const observation = ProfileObservationStub({
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
      });

      const result = profileObservationMergeTransformer({
        observation,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
        rssMB: MegabytesStub({ value: 1800 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + profileStatics.settle.afterMs }),
      });

      expect(result.pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 },
      ]);
    });

    it('VALID: {a second settled reading} => accumulates the sum and the beat count', () => {
      const observation = ProfileObservationStub({
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + profileStatics.settle.afterMs,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 }],
      });

      const result = profileObservationMergeTransformer({
        observation,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
        rssMB: MegabytesStub({ value: 1900 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + profileStatics.settle.afterMs + 5000 }),
      });

      expect(result.pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 3700, steadyBeats: 2 },
      ]);
    });
  });

  describe('the pool grows mid-run', () => {
    it('VALID: {a settled beat at pool size 3 on a record holding pool size 1} => opens a second bucket and leaves the first untouched', () => {
      const observation = ProfileObservationStub({
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + profileStatics.settle.afterMs,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 }],
      });

      const result = profileObservationMergeTransformer({
        observation,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 3 }),
        rssMB: MegabytesStub({ value: 1920 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + profileStatics.settle.afterMs + 5000 }),
      });

      expect(result.pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 },
        { poolSize: 3, peakMB: 1920, steadySumMB: 1920, steadyBeats: 1 },
      ]);
    });

    it('VALID: {a beat back down at pool size 1 after a pool-size-3 bucket exists} => merges into the pool-size-1 bucket and keeps both sorted', () => {
      const observation = ProfileObservationStub({
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + profileStatics.settle.afterMs,
        pools: [
          { poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 },
          { poolSize: 3, peakMB: 1920, steadySumMB: 1920, steadyBeats: 1 },
        ],
      });

      const result = profileObservationMergeTransformer({
        observation,
        instanceId: INSTANCE_ID,
        specHash: SPEC_HASH,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
        rssMB: MegabytesStub({ value: 1850 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + profileStatics.settle.afterMs + 9000 }),
      });

      expect(result.pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 3650, steadyBeats: 2 },
        { poolSize: 3, peakMB: 1920, steadySumMB: 1920, steadyBeats: 1 },
      ]);
    });
  });
});
