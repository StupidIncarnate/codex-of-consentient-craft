import { smoketestPlaceholderContract } from './smoketest-placeholder-contract';
import { SmoketestPlaceholderStub } from './smoketest-placeholder.stub';

describe('smoketestPlaceholderContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "smoketest-placeholder"} => parses successfully', () => {
      const result = SmoketestPlaceholderStub({ value: 'smoketest-placeholder' });

      expect(result).toBe('smoketest-placeholder');
    });

    it('VALID: {default stub} => parses with default value', () => {
      const result = SmoketestPlaceholderStub();

      expect(result).toBe('smoketest-placeholder');
    });

    it('VALID: {value: "any-non-empty-string"} => parses successfully', () => {
      const result = smoketestPlaceholderContract.parse('any-non-empty-string');

      expect(result).toBe('any-non-empty-string');
    });
  });

  describe('invalid values', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => smoketestPlaceholderContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: 123} => throws for non-string', () => {
      expect(() => smoketestPlaceholderContract.parse(123 as never)).toThrow(/Expected string/u);
    });

    it('INVALID: {value: null} => throws for null', () => {
      expect(() => smoketestPlaceholderContract.parse(null as never)).toThrow(/Expected string/u);
    });
  });
});
