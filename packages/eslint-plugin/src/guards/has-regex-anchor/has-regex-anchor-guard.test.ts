import { hasRegexAnchorGuard } from './has-regex-anchor-guard';

describe('hasRegexAnchorGuard', () => {
  describe('fully anchored patterns', () => {
    it('VALID: {pattern: "^hello$"} => returns true', () => {
      expect(hasRegexAnchorGuard({ pattern: '^hello$' })).toBe(true);
    });

    it('VALID: {pattern: "^start with content$"} => returns true', () => {
      expect(hasRegexAnchorGuard({ pattern: '^start with content$' })).toBe(true);
    });
  });

  describe('single-anchor patterns (still partial matching)', () => {
    it('INVALID: {pattern: "^start"} => returns false (missing $)', () => {
      expect(hasRegexAnchorGuard({ pattern: '^start' })).toBe(false);
    });

    it('INVALID: {pattern: "end$"} => returns false (missing ^)', () => {
      expect(hasRegexAnchorGuard({ pattern: 'end$' })).toBe(false);
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

  describe('sham anchors (^.* or .*$ defeat the purpose)', () => {
    it('INVALID: {pattern: "^.*text.*$"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: '^.*text.*$' })).toBe(false);
    });

    it('INVALID: {pattern: "^.*something"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: '^.*something' })).toBe(false);
    });

    it('INVALID: {pattern: "something.*$"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: 'something.*$' })).toBe(false);
    });

    it('INVALID: {pattern: "^[\\s\\S]*partial[\\s\\S]*$"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: '^[\\s\\S]*partial[\\s\\S]*$' })).toBe(false);
    });

    it('INVALID: {pattern: "^[\\s\\S]*something"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: '^[\\s\\S]*something' })).toBe(false);
    });

    it('INVALID: {pattern: "something[\\s\\S]*$"} => returns false', () => {
      expect(hasRegexAnchorGuard({ pattern: 'something[\\s\\S]*$' })).toBe(false);
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
