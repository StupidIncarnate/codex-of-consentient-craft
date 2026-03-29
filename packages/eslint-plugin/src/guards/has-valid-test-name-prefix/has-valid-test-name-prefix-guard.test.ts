import { hasValidTestNamePrefixGuard } from './has-valid-test-name-prefix-guard';

describe('hasValidTestNamePrefixGuard', () => {
  describe('valid prefixes', () => {
    it('VALID: {name: "VALID: test"} => returns true', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'VALID: {input} => result' })).toBe(true);
    });

    it('VALID: {name: "INVALID: test"} => returns true', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'INVALID: {bad input} => throws' })).toBe(true);
    });

    it('VALID: {name: "ERROR: test"} => returns true', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'ERROR: {failure} => returns error' })).toBe(true);
    });

    it('VALID: {name: "EDGE: test"} => returns true', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'EDGE: {boundary} => handles edge' })).toBe(true);
    });

    it('VALID: {name: "EMPTY: test"} => returns true', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'EMPTY: {null} => returns default' })).toBe(true);
    });
  });

  describe('invalid prefixes', () => {
    it('INVALID: {name: "returns value"} => returns false', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'returns the correct value' })).toBe(false);
    });

    it('INVALID: {name: "MISSING: test"} => returns false', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'MISSING: {input} => null' })).toBe(false);
    });

    it('INVALID: {name: "VALID_ONLY: test"} => returns false', () => {
      expect(hasValidTestNamePrefixGuard({ name: 'VALID_ONLY: {only lint}' })).toBe(false);
    });
  });

  describe('empty/missing input', () => {
    it('EMPTY: {name: undefined} => returns false', () => {
      expect(hasValidTestNamePrefixGuard({})).toBe(false);
    });

    it('EMPTY: {name: ""} => returns false', () => {
      expect(hasValidTestNamePrefixGuard({ name: '' })).toBe(false);
    });
  });
});
