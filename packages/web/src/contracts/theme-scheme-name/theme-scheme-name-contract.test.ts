import { themeSchemeNameContract } from './theme-scheme-name-contract';
import { ThemeSchemeNameStub } from './theme-scheme-name.stub';

const MAX_THEME_SCHEME_NAME_LENGTH = 50;

describe('themeSchemeNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Ember Depths"} => parses theme name', () => {
      const result = themeSchemeNameContract.parse('Ember Depths');

      expect(result).toBe('Ember Depths');
    });

    it('VALID: {value: "A"} => parses single character name', () => {
      const result = themeSchemeNameContract.parse('A');

      expect(result).toBe('A');
    });

    it('VALID: {value: max length} => parses max length name', () => {
      const name = 'A'.repeat(MAX_THEME_SCHEME_NAME_LENGTH);
      const result = themeSchemeNameContract.parse(name);

      expect(result).toBe(name);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => themeSchemeNameContract.parse('')).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {value: exceeds max} => throws for exceeding max length', () => {
      expect(() =>
        themeSchemeNameContract.parse('A'.repeat(MAX_THEME_SCHEME_NAME_LENGTH + 1)),
      ).toThrow(/expected string to have <=50 characters/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => themeSchemeNameContract.parse(null)).toThrow(/expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => themeSchemeNameContract.parse(undefined)).toThrow(/received undefined/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid theme scheme name', () => {
      const result = ThemeSchemeNameStub();

      expect(result).toBe('Ember Depths');
    });

    it('VALID: {value: "Frost"} => creates name with custom value', () => {
      const result = ThemeSchemeNameStub({ value: 'Frost' });

      expect(result).toBe('Frost');
    });
  });
});
