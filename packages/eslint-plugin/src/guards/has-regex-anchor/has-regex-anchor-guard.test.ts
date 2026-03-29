import { hasRegexAnchorGuard } from './has-regex-anchor-guard';

describe('hasRegexAnchorGuard', () => {
  describe('anchored patterns', () => {
    it('VALID: {pattern: "^hello$"} => returns true', () => {
      expect(hasRegexAnchorGuard({ pattern: '^hello$' })).toBe(true);
    });

    it('VALID: {pattern: "^start"} => returns true', () => {
      expect(hasRegexAnchorGuard({ pattern: '^start' })).toBe(true);
    });

    it('VALID: {pattern: "end$"} => returns true', () => {
      expect(hasRegexAnchorGuard({ pattern: 'end$' })).toBe(true);
    });
  });

  describe('unanchored patterns', () => {
    it('INVALID: {pattern: "some text"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: 'some text' })).toBe(false);
    });

    it('INVALID: {pattern: "error"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: 'error' })).toBe(false);
    });
  });

  describe('empty/missing', () => {
    it('EMPTY: {pattern: undefined} => returns false', () => {
      expect(hasRegexAnchorGuard({})).toBe(false);
    });

    it('EMPTY: {pattern: ""} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: '' })).toBe(false);
    });
  });
});
