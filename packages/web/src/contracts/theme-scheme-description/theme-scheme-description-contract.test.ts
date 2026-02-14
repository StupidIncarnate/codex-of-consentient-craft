import { themeSchemeDescriptionContract } from './theme-scheme-description-contract';
import { ThemeSchemeDescriptionStub } from './theme-scheme-description.stub';

const MAX_THEME_SCHEME_DESCRIPTION_LENGTH = 200;

describe('themeSchemeDescriptionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: description} => parses theme description', () => {
      const result = themeSchemeDescriptionContract.parse(
        'Dark volcanic caverns with ember accents',
      );

      expect(result).toBe('Dark volcanic caverns with ember accents');
    });

    it('VALID: {value: "A"} => parses single character description', () => {
      const result = themeSchemeDescriptionContract.parse('A');

      expect(result).toBe('A');
    });

    it('VALID: {value: max length} => parses max length description', () => {
      const desc = 'A'.repeat(MAX_THEME_SCHEME_DESCRIPTION_LENGTH);
      const result = themeSchemeDescriptionContract.parse(desc);

      expect(result).toBe(desc);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => themeSchemeDescriptionContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID_VALUE: {value: exceeds max} => throws for exceeding max length', () => {
      expect(() =>
        themeSchemeDescriptionContract.parse('A'.repeat(MAX_THEME_SCHEME_DESCRIPTION_LENGTH + 1)),
      ).toThrow(/String must contain at most 200 character/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => themeSchemeDescriptionContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => themeSchemeDescriptionContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid theme scheme description', () => {
      const result = ThemeSchemeDescriptionStub();

      expect(result).toBe('Dark volcanic caverns with ember accents');
    });

    it('VALID: {value: custom} => creates description with custom value', () => {
      const result = ThemeSchemeDescriptionStub({ value: 'Icy frost theme' });

      expect(result).toBe('Icy frost theme');
    });
  });
});
