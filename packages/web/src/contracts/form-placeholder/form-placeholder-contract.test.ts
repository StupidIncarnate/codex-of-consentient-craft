import { formPlaceholderContract } from './form-placeholder-contract';
import { FormPlaceholderStub } from './form-placeholder.stub';

describe('formPlaceholderContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Enter..."} => parses placeholder text', () => {
      const result = formPlaceholderContract.parse('Enter...');

      expect(result).toBe('Enter...');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => formPlaceholderContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => formPlaceholderContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid placeholder', () => {
      const result = FormPlaceholderStub();

      expect(result).toBe('Enter value...');
    });

    it('VALID: {value: "Search..."} => creates placeholder with custom value', () => {
      const result = FormPlaceholderStub({ value: 'Search...' });

      expect(result).toBe('Search...');
    });
  });
});
