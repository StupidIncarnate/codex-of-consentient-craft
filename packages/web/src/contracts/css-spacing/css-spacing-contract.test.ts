import { cssSpacingContract } from './css-spacing-contract';
import { CssSpacingStub } from './css-spacing.stub';

describe('cssSpacingContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 8} => parses spacing value', () => {
      const result = cssSpacingContract.parse(8);

      expect(result).toBe(8);
    });

    it('VALID: {value: 0} => parses zero spacing', () => {
      const result = cssSpacingContract.parse(0);

      expect(result).toBe(0);
    });
  });

  describe('invalid inputs', () => {
    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => cssSpacingContract.parse(null)).toThrow(/Expected number/u);
    });

    it('INVALID_VALUE: {value: "8px"} => throws for string', () => {
      expect(() => cssSpacingContract.parse('8px')).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid spacing', () => {
      const result = CssSpacingStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 16} => creates spacing with custom value', () => {
      const result = CssSpacingStub({ value: 16 });

      expect(result).toBe(16);
    });
  });
});
