import { isCheckTypeGuard } from './is-check-type-guard';

describe('isCheckTypeGuard', () => {
  describe('valid check types', () => {
    it('VALID: {value: "lint"} => returns true', () => {
      const result = isCheckTypeGuard({ value: 'lint' });

      expect(result).toBe(true);
    });

    it('VALID: {value: "typecheck"} => returns true', () => {
      const result = isCheckTypeGuard({ value: 'typecheck' });

      expect(result).toBe(true);
    });

    it('VALID: {value: "test"} => returns true', () => {
      const result = isCheckTypeGuard({ value: 'unit' });

      expect(result).toBe(true);
    });
  });

  describe('invalid check types', () => {
    it('INVALID_VALUE: {value: "unknown"} => returns false', () => {
      const result = isCheckTypeGuard({ value: 'unknown' });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {value: ""} => returns false', () => {
      const result = isCheckTypeGuard({ value: '' });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {value: 123} => returns false', () => {
      const result = isCheckTypeGuard({ value: 123 });

      expect(result).toBe(false);
    });

    it('EMPTY: {value: null} => returns false', () => {
      const result = isCheckTypeGuard({ value: null });

      expect(result).toBe(false);
    });

    it('EMPTY: {value: undefined} => returns false', () => {
      const result = isCheckTypeGuard({});

      expect(result).toBe(false);
    });
  });
});
