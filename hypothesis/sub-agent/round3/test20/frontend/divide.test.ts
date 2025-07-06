import { divide } from './divide';

describe('FRONTEND AMAZING - divide function', () => {
  describe('valid inputs', () => {
    it('should divide two positive numbers', () => {
      expect(divide(6, 3)).toBe(2);
    });

    it('should divide two negative numbers', () => {
      expect(divide(-6, -3)).toBe(2);
    });

    it('should divide a positive by a negative number', () => {
      expect(divide(6, -3)).toBe(-2);
    });

    it('should divide a negative by a positive number', () => {
      expect(divide(-6, 3)).toBe(-2);
    });

    it('should divide zero by a number', () => {
      expect(divide(0, 5)).toBe(0);
    });

    it('should divide by one', () => {
      expect(divide(5, 1)).toBe(5);
    });

    it('should divide decimal numbers', () => {
      expect(divide(7.5, 2.5)).toBe(3);
    });

    it('should handle large numbers', () => {
      expect(divide(2000000, 1000)).toBe(2000);
    });

    it('should handle very small numbers', () => {
      expect(divide(0.000006, 0.000002)).toBeCloseTo(3);
    });

    it('should handle fractions', () => {
      expect(divide(0.25, 0.5)).toBe(0.5);
    });

    it('should return 1 when dividing a number by itself', () => {
      expect(divide(5, 5)).toBe(1);
    });

    it('should handle division that results in a decimal', () => {
      expect(divide(1, 3)).toBeCloseTo(0.333333);
    });
  });

  describe('error handling', () => {
    it('should throw error when first argument is not a number', () => {
      expect(() => divide('6' as any, 3)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when second argument is not a number', () => {
      expect(() => divide(6, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when both arguments are not numbers', () => {
      expect(() => divide('6' as any, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when first argument is NaN', () => {
      expect(() => divide(NaN, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is NaN', () => {
      expect(() => divide(6, NaN)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when first argument is Infinity', () => {
      expect(() => divide(Infinity, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is Infinity', () => {
      expect(() => divide(6, Infinity)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when dividing by zero', () => {
      expect(() => divide(6, 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw error when dividing zero by zero', () => {
      expect(() => divide(0, 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw error when arguments are null', () => {
      expect(() => divide(null as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => divide(6, null as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when arguments are undefined', () => {
      expect(() => divide(undefined as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => divide(6, undefined as any)).toThrow('Both arguments must be numbers');
    });
  });
});