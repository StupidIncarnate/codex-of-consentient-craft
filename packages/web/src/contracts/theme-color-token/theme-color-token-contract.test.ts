import { themeColorTokenContract } from './theme-color-token-contract';
import { ThemeColorTokenStub } from './theme-color-token.stub';

describe('themeColorTokenContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "primary"} => parses primary token', () => {
      const result = themeColorTokenContract.parse('primary');

      expect(result).toBe('primary');
    });

    it('VALID: {value: "bg-deep"} => parses background token', () => {
      const result = themeColorTokenContract.parse('bg-deep');

      expect(result).toBe('bg-deep');
    });

    it('VALID: {value: "loot-gold"} => parses loot token', () => {
      const result = themeColorTokenContract.parse('loot-gold');

      expect(result).toBe('loot-gold');
    });

    it('VALID: {value: "danger"} => parses danger token', () => {
      const result = themeColorTokenContract.parse('danger');

      expect(result).toBe('danger');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "invalid"} => throws for unknown token', () => {
      expect(() => themeColorTokenContract.parse('invalid')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: "PRIMARY"} => throws for wrong case', () => {
      expect(() => themeColorTokenContract.parse('PRIMARY')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => themeColorTokenContract.parse('')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => themeColorTokenContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => themeColorTokenContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid theme color token', () => {
      const result = ThemeColorTokenStub();

      expect(result).toBe('primary');
    });

    it('VALID: {value: "danger"} => creates token with custom value', () => {
      const result = ThemeColorTokenStub({ value: 'danger' });

      expect(result).toBe('danger');
    });
  });
});
