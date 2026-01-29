/**
 * PURPOSE: Tests for SearchPattern contract validation
 *
 * USAGE:
 * npm test -- search-pattern-contract.test.ts
 */
import { searchPatternContract } from './search-pattern-contract';
import { SearchPatternStub } from './search-pattern.stub';

describe('searchPatternContract', () => {
  describe('parse', () => {
    it('VALID: {string} => returns branded SearchPattern', () => {
      const result = searchPatternContract.parse('DangerFun');

      expect(typeof result).toBe('string');
    });

    it('VALID: {empty string} => returns branded empty SearchPattern', () => {
      const result = searchPatternContract.parse('');

      expect(result).toBe('');
    });
  });
});

describe('SearchPatternStub', () => {
  describe('default', () => {
    it('VALID: {} => returns default pattern', () => {
      const result = SearchPatternStub();

      expect(result).toBe('test-pattern');
    });
  });

  describe('custom value', () => {
    it('VALID: {value: "custom"} => returns custom pattern', () => {
      const result = SearchPatternStub({ value: 'custom-search' });

      expect(result).toBe('custom-search');
    });
  });
});
