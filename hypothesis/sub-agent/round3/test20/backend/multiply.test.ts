import { multiply } from './multiply';

describe('BACKEND GREAT - multiply function', () => {
  describe('valid inputs', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(2, 3)).toBe(6);
    });

    it('should multiply two negative numbers', () => {
      expect(multiply(-2, -3)).toBe(6);
    });

    it('should multiply a positive and negative number', () => {
      expect(multiply(5, -3)).toBe(-15);
    });

    it('should multiply a negative and positive number', () => {
      expect(multiply(-5, 3)).toBe(-15);
    });

    it('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0);
      expect(multiply(0, 5)).toBe(0);
      expect(multiply(0, 0)).toBe(0);
    });

    it('should multiply by one', () => {
      expect(multiply(5, 1)).toBe(5);
      expect(multiply(1, 5)).toBe(5);
    });

    it('should multiply decimal numbers', () => {
      expect(multiply(1.5, 2.5)).toBe(3.75);
    });

    it('should handle large numbers', () => {
      expect(multiply(1000, 2000)).toBe(2000000);
    });

    it('should handle very small numbers', () => {
      expect(multiply(0.001, 0.002)).toBeCloseTo(0.000002);
    });

    it('should handle fractions', () => {
      expect(multiply(0.5, 0.5)).toBe(0.25);
    });
  });

  describe('error handling', () => {
    it('should throw error when first argument is not a number', () => {
      expect(() => multiply('2' as any, 3)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when second argument is not a number', () => {
      expect(() => multiply(2, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when both arguments are not numbers', () => {
      expect(() => multiply('2' as any, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when first argument is NaN', () => {
      expect(() => multiply(NaN, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is NaN', () => {
      expect(() => multiply(2, NaN)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when first argument is Infinity', () => {
      expect(() => multiply(Infinity, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is Infinity', () => {
      expect(() => multiply(2, Infinity)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when arguments are null', () => {
      expect(() => multiply(null as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => multiply(2, null as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when arguments are undefined', () => {
      expect(() => multiply(undefined as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => multiply(2, undefined as any)).toThrow('Both arguments must be numbers');
    });
  });
});