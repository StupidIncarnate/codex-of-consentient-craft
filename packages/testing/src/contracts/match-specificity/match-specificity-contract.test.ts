import { matchSpecificityContract } from './match-specificity-contract';
import { MatchSpecificityStub } from './match-specificity.stub';

describe('matchSpecificityContract', () => {
  describe('valid values', () => {
    it('VALID: {default stub} => parses to 1', () => {
      expect(MatchSpecificityStub()).toBe(1);
    });

    it('VALID: {value: 0} => parses a zero score', () => {
      expect(matchSpecificityContract.parse(0)).toBe(0);
    });

    it('VALID: {value: 7} => parses a multi-leaf score', () => {
      expect(MatchSpecificityStub({ value: 7 })).toBe(7);
    });
  });

  describe('invalid values', () => {
    it('INVALID: {value: -1} => throws', () => {
      expect(() => matchSpecificityContract.parse(-1)).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {value: 1.5} => throws', () => {
      expect(() => matchSpecificityContract.parse(1.5)).toThrow(/integer/u);
    });

    it('INVALID: {value: "3"} => throws', () => {
      expect(() => matchSpecificityContract.parse('3' as never)).toThrow(/Expected number/u);
    });
  });
});
