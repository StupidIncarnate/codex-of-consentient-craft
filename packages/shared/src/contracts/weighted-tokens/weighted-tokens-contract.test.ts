import { weightedTokensContract } from './weighted-tokens-contract';
import { WeightedTokensStub } from './weighted-tokens.stub';

describe('weightedTokensContract', () => {
  describe('valid input', () => {
    it('VALID: {a measured seven-day ceiling} => parses to the same number', () => {
      expect(weightedTokensContract.parse(2_751_372_486)).toBe(2_751_372_486);
    });

    it('EMPTY: {0} => parses, because a fresh window has spent nothing', () => {
      expect(WeightedTokensStub({ value: 0 })).toBe(0);
    });

    it('VALID: {a fractional total} => parses, because the 0.1 cache-read weight produces them', () => {
      expect(WeightedTokensStub({ value: 1_606_202_358.9 })).toBe(1_606_202_358.9);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {-1} => throws, because spend never goes backwards', () => {
      expect(() => WeightedTokensStub({ value: -1 })).toThrow(/greater than or equal to 0/u);
    });
  });
});
