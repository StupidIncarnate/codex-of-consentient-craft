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
      expect(() => matchSpecificityContract.parse(-1)).toThrow(/expected number to be >=0/u);
    });

    it('INVALID: {value: 1.5} => throws', () => {
      expect(() => matchSpecificityContract.parse(1.5)).toThrow(/expected int, received number/u);
    });

    it('INVALID: {value: "3"} => throws', () => {
      expect(() => matchSpecificityContract.parse('3')).toThrow(/expected number/u);
    });
  });
});
