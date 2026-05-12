import { trailingThinkingIndexContract } from './trailing-thinking-index-contract';
import { TrailingThinkingIndexStub } from './trailing-thinking-index.stub';

describe('trailingThinkingIndexContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: -1} => parses sentinel', () => {
      const result = trailingThinkingIndexContract.parse(-1);

      expect(result).toBe(-1);
    });

    it('VALID: {value: 0} => parses zero', () => {
      const result = trailingThinkingIndexContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 12} => parses positive integer', () => {
      const result = trailingThinkingIndexContract.parse(12);

      expect(result).toBe(12);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -2} => throws', () => {
      expect(() => trailingThinkingIndexContract.parse(-2)).toThrow(
        /Number must be greater than or equal to -1/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => trailingThinkingIndexContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns -1 sentinel', () => {
      expect(TrailingThinkingIndexStub()).toBe(-1);
    });

    it('VALID: {value: 7} => returns 7', () => {
      expect(TrailingThinkingIndexStub({ value: 7 })).toBe(7);
    });
  });
});
