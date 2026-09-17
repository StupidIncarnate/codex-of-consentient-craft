import { capacityProfileContract } from './capacity-profile-contract';
import { CapacityProfileStub } from './capacity-profile.stub';

describe('capacityProfileContract', () => {
  describe('a selected sample group', () => {
    it('VALID: {the solo group} => parses the group as measured', () => {
      const result = capacityProfileContract.parse(
        CapacityProfileStub({
          spec: 'dungeonmaster-web',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        }),
      );

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 1,
        steadyMB: 1800,
        peakMB: 2600,
        fromRuns: 9,
      });
    });

    it('VALID: {the contended group} => parses its own higher figures, never a blend of the two', () => {
      const result = capacityProfileContract.parse(
        CapacityProfileStub({ poolSize: 3, steadyMB: 1920, peakMB: 2810, fromRuns: 5 }),
      );

      expect(result).toStrictEqual({
        spec: 'dungeonmaster-web',
        poolSize: 3,
        steadyMB: 1920,
        peakMB: 2810,
        fromRuns: 5,
      });
    });
  });

  describe('invalid groups', () => {
    it('INVALID: {poolSize: 0} => throws, the instance that produced the reading is itself one', () => {
      expect(() => CapacityProfileStub({ poolSize: 0 })).toThrow(/greater than 0/iu);
    });

    it('INVALID: {an extra runs key} => throws, the block is strict', () => {
      expect(() => CapacityProfileStub({ runs: 9 } as never)).toThrow(/unrecognized key/iu);
    });
  });
});
