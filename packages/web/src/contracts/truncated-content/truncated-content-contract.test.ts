import { truncatedContentContract } from './truncated-content-contract';
import { TruncatedContentStub } from './truncated-content.stub';

describe('truncatedContentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "truncated text"} => parses string', () => {
      const result = truncatedContentContract.parse('truncated text');

      expect(result).toBe('truncated text');
    });

    it('VALID: {value: ""} => parses empty string', () => {
      const result = truncatedContentContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 123} => throws for number', () => {
      expect(() => truncatedContentContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => truncatedContentContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid truncated content', () => {
      const result = TruncatedContentStub();

      expect(result).toBe('truncated content');
    });

    it('VALID: {value: "custom"} => creates truncated content with custom value', () => {
      const result = TruncatedContentStub({ value: 'custom' });

      expect(result).toBe('custom');
    });
  });
});
