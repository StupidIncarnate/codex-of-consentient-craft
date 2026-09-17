import { ProfileObservationStub } from '../../contracts/profile-observation/profile-observation.stub';

import { profileSamplesGroupTransformer } from './profile-samples-group-transformer';

describe('profileSamplesGroupTransformer', () => {
  describe('samples are grouped by pool size, never averaged across them', () => {
    it('VALID: {two runs solo and two contended} => returns two groups, each with its own steadyMB, peakMB and runs', () => {
      const observations = [
        ProfileObservationStub({
          instanceId: 'inst_aaaa1111',
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 3600, steadyBeats: 2 }],
        }),
        ProfileObservationStub({
          instanceId: 'inst_bbbb2222',
          pools: [{ poolSize: 1, peakMB: 2500, steadySumMB: 3700, steadyBeats: 2 }],
        }),
        ProfileObservationStub({
          instanceId: 'inst_cccc3333',
          pools: [{ poolSize: 3, peakMB: 2810, steadySumMB: 3900, steadyBeats: 2 }],
        }),
        ProfileObservationStub({
          instanceId: 'inst_dddd4444',
          pools: [{ poolSize: 3, peakMB: 2700, steadySumMB: 3780, steadyBeats: 2 }],
        }),
      ];

      const result = profileSamplesGroupTransformer({ observations });

      expect(result).toStrictEqual([
        { poolSize: 1, steadyMB: 1825, peakMB: 2600, runs: 2 },
        { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 2 },
      ]);
    });

    it('VALID: {one run measured under both conditions} => its two buckets land in two different groups', () => {
      const observations = [
        ProfileObservationStub({
          instanceId: 'inst_aaaa1111',
          pools: [
            { poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 },
            { poolSize: 3, peakMB: 2810, steadySumMB: 1920, steadyBeats: 1 },
          ],
        }),
      ];

      const result = profileSamplesGroupTransformer({ observations });

      expect(result).toStrictEqual([
        { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 1 },
        { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 1 },
      ]);
    });

    it('VALID: {groups arriving out of order} => returns them sorted by ascending pool size', () => {
      const observations = [
        ProfileObservationStub({
          instanceId: 'inst_aaaa1111',
          pools: [{ poolSize: 4, peakMB: 3000, steadySumMB: 2000, steadyBeats: 1 }],
        }),
        ProfileObservationStub({
          instanceId: 'inst_bbbb2222',
          pools: [{ poolSize: 2, peakMB: 2700, steadySumMB: 1850, steadyBeats: 1 }],
        }),
      ];

      const result = profileSamplesGroupTransformer({ observations });

      expect(result).toStrictEqual([
        { poolSize: 2, steadyMB: 1850, peakMB: 2700, runs: 1 },
        { poolSize: 4, steadyMB: 2000, peakMB: 3000, runs: 1 },
      ]);
    });
  });

  describe('peak is the ceiling, steady is pooled over beats', () => {
    it('VALID: {a long run and a short one in one group} => steady weighs each by the beats it measured', () => {
      const observations = [
        ProfileObservationStub({
          instanceId: 'inst_aaaa1111',
          pools: [{ poolSize: 1, peakMB: 2000, steadySumMB: 9000, steadyBeats: 9 }],
        }),
        ProfileObservationStub({
          instanceId: 'inst_bbbb2222',
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 2000, steadyBeats: 1 }],
        }),
      ];

      const result = profileSamplesGroupTransformer({ observations });

      expect(result).toStrictEqual([{ poolSize: 1, steadyMB: 1100, peakMB: 2600, runs: 2 }]);
    });

    it('EDGE: {a steady mean that is not a whole number} => floors it', () => {
      const observations = [
        ProfileObservationStub({
          instanceId: 'inst_aaaa1111',
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 1001, steadyBeats: 2 }],
        }),
      ];

      const result = profileSamplesGroupTransformer({ observations });

      expect(result).toStrictEqual([{ poolSize: 1, steadyMB: 500, peakMB: 2600, runs: 1 }]);
    });
  });

  describe('a group with no settled beat', () => {
    it('EDGE: {every run killed inside the settle window} => steadyMB falls back to that group peak', () => {
      const observations = [
        ProfileObservationStub({
          instanceId: 'inst_aaaa1111',
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
        }),
      ];

      const result = profileSamplesGroupTransformer({ observations });

      expect(result).toStrictEqual([{ poolSize: 1, steadyMB: 2600, peakMB: 2600, runs: 1 }]);
    });
  });

  describe('nothing measured', () => {
    it('EMPTY: {observations: []} => returns no groups', () => {
      expect(profileSamplesGroupTransformer({ observations: [] })).toStrictEqual([]);
    });

    it('EMPTY: {a record whose every beat failed to measure} => returns no groups', () => {
      const observations = [ProfileObservationStub({ pools: [] })];

      expect(profileSamplesGroupTransformer({ observations })).toStrictEqual([]);
    });
  });
});
