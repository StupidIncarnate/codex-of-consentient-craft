import { followupDepthContract } from './followup-depth-contract';
import { FollowupDepthStub } from './followup-depth.stub';

describe('followupDepthContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses successfully', () => {
      const result = followupDepthContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 3} => parses successfully', () => {
      const result = followupDepthContract.parse(3);

      expect(result).toBe(3);
    });

    it('VALID: {FollowupDepthStub()} => creates default depth of 0', () => {
      const result = FollowupDepthStub();

      expect(result).toBe(0);
    });

    it('VALID: {FollowupDepthStub with value 5} => creates depth of 5', () => {
      const result = FollowupDepthStub({ value: 5 });

      expect(result).toBe(5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => followupDepthContract.parse(-1)).toThrow(/too_small/u);
    });

    it('INVALID: {value: 1.5} => throws validation error', () => {
      expect(() => followupDepthContract.parse(1.5)).toThrow(/integer/u);
    });

    it('INVALID: {value: "not-a-number"} => throws validation error', () => {
      expect(() => followupDepthContract.parse('not-a-number')).toThrow(/Expected number/u);
    });
  });
});
