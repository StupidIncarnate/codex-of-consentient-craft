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
    it('INVALID: {framework: "invalid"} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: 'invalid' });

      expect(result).toBe(false);
    });

    it('INVALID: {framework: 123} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: 123 });

      expect(result).toBe(false);
    });

    it('INVALID: {framework: undefined} => returns false', () => {
      const result = isValidFrameworkGuard({});

      expect(result).toBe(false);
    });

    it('INVALID: {framework: null} => returns false', () => {
      const result = isValidFrameworkGuard({ framework: null });

      expect(result).toBe(false);
    });
  });
});
