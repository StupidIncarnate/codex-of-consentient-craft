import { specProfileContract } from './spec-profile-contract';
import { SpecProfileStub } from './spec-profile.stub';

describe('specProfileContract', () => {
  describe('a measured profile', () => {
    it('VALID: {two pool-size groups} => parses to the complete answer, both groups intact', () => {
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-web',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });

      expect(specProfileContract.parse(profile)).toStrictEqual({
        specName: 'dungeonmaster-web',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });
    });
  });

  describe('a spec nothing has measured', () => {
    it('EMPTY: {no samples, no boot, no date} => parses, because "never measured" is a real answer', () => {
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-headless',
        processes: 1,
        hash: 'a3f9c2e1',
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });

      expect(specProfileContract.parse(profile)).toStrictEqual({
        specName: 'dungeonmaster-headless',
        processes: 1,
        hash: 'a3f9c2e1',
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
    });
  });

  describe('invalid profiles', () => {
    it('INVALID: {poolSize: 0 in a sample} => throws', () => {
      expect(() => {
        specProfileContract.parse({
          specName: 'dungeonmaster-web',
          processes: 3,
          hash: 'a3f9c2e1',
          measuredAt: null,
          fromRuns: 1,
          bootMs: null,
          samples: [{ poolSize: 0, steadyMB: 1800, peakMB: 2600, runs: 1 }],
        });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {a sample with no poolSize} => throws, a reading without its condition is not a reading', () => {
      expect(() => {
        specProfileContract.parse({
          specName: 'dungeonmaster-web',
          processes: 3,
          hash: 'a3f9c2e1',
          measuredAt: null,
          fromRuns: 1,
          bootMs: null,
          samples: [{ steadyMB: 1800, peakMB: 2600, runs: 1 }],
        });
      }).toThrow(/Required/u);
    });
  });
});
