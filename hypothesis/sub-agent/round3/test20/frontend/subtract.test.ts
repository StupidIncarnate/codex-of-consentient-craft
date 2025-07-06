import { subtract } from './subtract';

describe('FRONTEND AMAZING - subtract function', () => {
  describe('valid inputs', () => {
    it('should subtract two positive numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should subtract two negative numbers', () => {
      expect(subtract(-2, -3)).toBe(1);
    });

    it('should subtract a negative from a positive number', () => {
      expect(subtract(5, -3)).toBe(8);
    });

    it('should subtract a positive from a negative number', () => {
      expect(subtract(-5, 3)).toBe(-8);
    });

    it('should subtract zero from a number', () => {
      expect(subtract(5, 0)).toBe(5);
    });

    it('should subtract a number from zero', () => {
      expect(subtract(0, 5)).toBe(-5);
    });

    it('should subtract decimal numbers', () => {
      expect(subtract(5.5, 2.5)).toBe(3);
    });

    it('should handle large numbers', () => {
      expect(subtract(3000000, 1000000)).toBe(2000000);
    });

    it('should handle very small numbers', () => {
      expect(subtract(0.000003, 0.000001)).toBeCloseTo(0.000002);
    });

    it('should return zero when subtracting a number from itself', () => {
      expect(subtract(5, 5)).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error when first argument is not a number', () => {
      expect(() => subtract('5' as any, 3)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when second argument is not a number', () => {
      expect(() => subtract(5, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when both arguments are not numbers', () => {
      expect(() => subtract('5' as any, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when first argument is NaN', () => {
      expect(() => subtract(NaN, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is NaN', () => {
      expect(() => subtract(5, NaN)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when first argument is Infinity', () => {
      expect(() => subtract(Infinity, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is Infinity', () => {
      expect(() => subtract(5, Infinity)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when arguments are null', () => {
      expect(() => subtract(null as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => subtract(5, null as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when arguments are undefined', () => {
      expect(() => subtract(undefined as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => subtract(5, undefined as any)).toThrow('Both arguments must be numbers');
    });
  });
});