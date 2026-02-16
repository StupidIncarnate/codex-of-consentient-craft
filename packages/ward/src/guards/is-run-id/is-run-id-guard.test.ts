import { isRunIdGuard } from './is-run-id-guard';

describe('isRunIdGuard', () => {
  describe('valid run IDs', () => {
    it('VALID: {value: "1739625600000-a3f1"} => returns true', () => {
      const result = isRunIdGuard({ value: '1739625600000-a3f1' });

      expect(result).toBe(true);
    });

    it('VALID: {value: "1700000000000-beef"} => returns true', () => {
      const result = isRunIdGuard({ value: '1700000000000-beef' });

      expect(result).toBe(true);
    });

    it('VALID: {value: "0-0"} => returns true for minimal pattern', () => {
      const result = isRunIdGuard({ value: '0-0' });

      expect(result).toBe(true);
    });
  });

  describe('invalid run IDs', () => {
    it('INVALID_VALUE: {value: "not-a-run-id"} => returns false', () => {
      const result = isRunIdGuard({ value: 'not-a-run-id' });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {value: ""} => returns false for empty string', () => {
      const result = isRunIdGuard({ value: '' });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {value: "abc-ZZZZ"} => returns false for non-hex', () => {
      const result = isRunIdGuard({ value: 'abc-ZZZZ' });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {value: "1739625600000"} => returns false for missing hex', () => {
      const result = isRunIdGuard({ value: '1739625600000' });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {value: 123} => returns false for number', () => {
      const result = isRunIdGuard({ value: 123 });

      expect(result).toBe(false);
    });

    it('EMPTY: {value: null} => returns false', () => {
      const result = isRunIdGuard({ value: null });

      expect(result).toBe(false);
    });

    it('EMPTY: {value: undefined} => returns false', () => {
      const result = isRunIdGuard({});

      expect(result).toBe(false);
    });
  });
});
