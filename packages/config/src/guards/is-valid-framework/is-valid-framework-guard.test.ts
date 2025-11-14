import { isValidFrameworkGuard } from './is-valid-framework-guard';

describe('isValidFrameworkGuard', () => {
  describe('valid frameworks', () => {
    it('VALID: {framework: "react"} => returns true', () => {
      const result = isValidFrameworkGuard({ framework: 'react' });

      expect(result).toBe(true);
    });

    it('VALID: {framework: "express"} => returns true', () => {
      const result = isValidFrameworkGuard({ framework: 'express' });

      expect(result).toBe(true);
    });

    it('VALID: {framework: "nextjs"} => returns true', () => {
      const result = isValidFrameworkGuard({ framework: 'nextjs' });

      expect(result).toBe(true);
    });
  });

  describe('invalid frameworks', () => {
    it('INVALID_VALUE: {framework: "invalid"} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: 'invalid' });

      expect(result).toBe(false);
    });

    it('INVALID_TYPE: {framework: 123} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: 123 });

      expect(result).toBe(false);
    });

    it('INVALID_UNDEFINED: {framework: undefined} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: undefined });

      expect(result).toBe(false);
    });

    it('INVALID_NULL: {framework: null} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: null });

      expect(result).toBe(false);
    });
  });
});
