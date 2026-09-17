import { ProfilePoolSizeStub } from '../../contracts/profile-pool-size/profile-pool-size.stub';
import { SpecProfileStub } from '../../contracts/spec-profile/spec-profile.stub';

import { capacitySampleSelectTransformer } from './capacity-sample-select-transformer';

describe('capacitySampleSelectTransformer', () => {
  describe('two groups, never blended', () => {
    it('VALID: {poolSize: 1, groups at 1 and 3} => returns the pool-size-1 group verbatim', () => {
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-web',
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
      });

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 1,
        steadyMB: 1800,
        peakMB: 2600,
        fromRuns: 9,
      });
    });

    it('VALID: {poolSize: 3, groups at 1 and 3} => returns the pool-size-3 group verbatim', () => {
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-web',
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 3 }),
      });

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 3,
        steadyMB: 1920,
        peakMB: 2810,
        fromRuns: 5,
      });
    });

    it('EDGE: {poolSize: 2, groups at 1 and 3} => returns the pool-size-1 group, the largest at or below', () => {
      const profile = SpecProfileStub({
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 2 }),
      });

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 1,
        steadyMB: 1800,
        peakMB: 2600,
        fromRuns: 9,
      });
    });

    it('EDGE: {poolSize: 9, groups at 1 and 3} => returns the pool-size-3 group, the largest measured', () => {
      const profile = SpecProfileStub({
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 9 }),
      });

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 3,
        steadyMB: 1920,
        peakMB: 2810,
        fromRuns: 5,
      });
    });

    it('VALID: {unsorted samples} => still returns the largest group at or below, not the first listed', () => {
      const profile = SpecProfileStub({
        samples: [
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 2, steadyMB: 1860, peakMB: 2700, runs: 2 },
        ],
      });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 2 }),
      });

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 2,
        steadyMB: 1860,
        peakMB: 2700,
        fromRuns: 2,
      });
    });
  });

  describe('every group above the requested pool', () => {
    it('EDGE: {poolSize: 1, only a pool-size-3 group} => returns that group rather than nothing', () => {
      const profile = SpecProfileStub({
        samples: [{ poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 }],
      });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 1 }),
      });

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 3,
        steadyMB: 1920,
        peakMB: 2810,
        fromRuns: 5,
      });
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {samples: []} => returns null rather than a fabricated group', () => {
      const profile = SpecProfileStub({ samples: [], fromRuns: 0, measuredAt: null, bootMs: null });

      const result = capacitySampleSelectTransformer({
        profile,
        poolSize: ProfilePoolSizeStub({ value: 3 }),
      });

      expect(result).toBe(null);
    });
  });
});
