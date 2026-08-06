import { testNamePatternMatchContract } from './test-name-pattern-match-contract';
import { TestNamePatternMatchStub } from './test-name-pattern-match.stub';

describe('testNamePatternMatchContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "matched"} => parses matched', () => {
      const result = testNamePatternMatchContract.parse('matched');

      expect(result).toBe('matched');
    });

    it('VALID: {value: "unmatched"} => parses unmatched', () => {
      const result = testNamePatternMatchContract.parse('unmatched');

      expect(result).toBe('unmatched');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "skip"} => throws for unknown outcome', () => {
      expect(() => testNamePatternMatchContract.parse('skip')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => testNamePatternMatchContract.parse('')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => testNamePatternMatchContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => testNamePatternMatchContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates matched', () => {
      const result = TestNamePatternMatchStub();

      expect(result).toBe('matched');
    });

    it('VALID: {value: "unmatched"} => creates unmatched', () => {
      const result = TestNamePatternMatchStub({ value: 'unmatched' });

      expect(result).toBe('unmatched');
    });
  });
});
