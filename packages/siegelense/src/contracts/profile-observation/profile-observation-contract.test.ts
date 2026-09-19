import { profileObservationContract } from './profile-observation-contract';
import { ProfileObservationStub } from './profile-observation.stub';

describe('profileObservationContract', () => {
  describe('valid observations', () => {
    it('VALID: {one pool bucket} => parses to the complete record', () => {
      const observation = ProfileObservationStub({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        firstBeatAtMs: 1_700_000_000_000,
        measuredAtMs: 1_700_000_600_000,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 12_600, steadyBeats: 7 }],
      });

      expect(profileObservationContract.parse(observation)).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash: 'a3f9c2e1',
        firstBeatAtMs: 1_700_000_000_000,
        measuredAtMs: 1_700_000_600_000,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 12_600, steadyBeats: 7 }],
      });
    });

    it('VALID: {two pool buckets} => keeps both, so one run measured under two conditions stays two readings', () => {
      const observation = ProfileObservationStub({
        pools: [
          { poolSize: 1, peakMB: 2600, steadySumMB: 12_600, steadyBeats: 7 },
          { poolSize: 3, peakMB: 2810, steadySumMB: 9600, steadyBeats: 5 },
        ],
      });

      expect(profileObservationContract.parse(observation).pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 12_600, steadyBeats: 7 },
        { poolSize: 3, peakMB: 2810, steadySumMB: 9600, steadyBeats: 5 },
      ]);
    });

    it('EMPTY: {pools: []} => a record whose every beat failed to measure parses', () => {
      const observation = ProfileObservationStub({ pools: [] });

      expect(profileObservationContract.parse(observation).pools).toStrictEqual([]);
    });
  });

  describe('invalid observations', () => {
    it('INVALID: {poolSize: 0} => throws', () => {
      expect(() => {
        profileObservationContract.parse({
          instanceId: 'inst_7f3a9c21',
          specHash: 'a3f9c2e1',
          firstBeatAtMs: 1_700_000_000_000,
          measuredAtMs: 1_700_000_600_000,
          pools: [{ poolSize: 0, peakMB: 2600, steadySumMB: 12_600, steadyBeats: 7 }],
        });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {peakMB: -1} => throws', () => {
      expect(() => {
        profileObservationContract.parse({
          instanceId: 'inst_7f3a9c21',
          specHash: 'a3f9c2e1',
          firstBeatAtMs: 1_700_000_000_000,
          measuredAtMs: 1_700_000_600_000,
          pools: [{ poolSize: 1, peakMB: -1, steadySumMB: 12_600, steadyBeats: 7 }],
        });
      }).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {no specHash} => throws, a profile record without its key cannot be filed', () => {
      expect(() => {
        profileObservationContract.parse({
          instanceId: 'inst_7f3a9c21',
          firstBeatAtMs: 1_700_000_000_000,
          measuredAtMs: 1_700_000_600_000,
          pools: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
