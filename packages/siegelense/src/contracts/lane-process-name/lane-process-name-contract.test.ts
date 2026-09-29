import { laneProcessNameContract } from './lane-process-name-contract';
import type { LaneProcessNameStub } from './lane-process-name.stub';

type LaneProcessName = ReturnType<typeof LaneProcessNameStub>;

describe('laneProcessNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "api"} => parses to itself', () => {
      const result: LaneProcessName = laneProcessNameContract.parse('api');

      expect(result).toBe('api');
    });

    it('VALID: {value: "web"} => parses to itself', () => {
      const result: LaneProcessName = laneProcessNameContract.parse('web');

      expect(result).toBe('web');
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: ""} => throws for an empty string', () => {
      expect(() => laneProcessNameContract.parse('')).toThrow(
        /expected string to have >=1 characters/u,
      );
    });
  });
});
