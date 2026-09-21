import { laneCapacityContract } from './lane-capacity-contract';
import { LaneCapacityStub } from './lane-capacity.stub';

describe('laneCapacityContract', () => {
  describe('valid capacity', () => {
    it('VALID: {suggested: 2} => parses', () => {
      const capacity = LaneCapacityStub({ suggested: 2 });

      const result = laneCapacityContract.parse(capacity);

      expect(result).toStrictEqual({ suggested: 2 });
    });

    it('VALID: {suggested: 0} => parses — the ceiling can read zero', () => {
      const capacity = LaneCapacityStub({ suggested: 0 });

      const result = laneCapacityContract.parse(capacity);

      expect(result.suggested).toBe(0);
    });
  });

  describe('invalid capacity', () => {
    it('INVALID: {suggested: -1} => throws on a negative count', () => {
      expect(() => laneCapacityContract.parse({ suggested: -1 })).toThrow(
        /greater than or equal to 0/u,
      );
    });

    it('INVALID: {suggested: 1.5} => throws on a non-integer count', () => {
      expect(() => laneCapacityContract.parse({ suggested: 1.5 })).toThrow(/integer/u);
    });
  });
});
