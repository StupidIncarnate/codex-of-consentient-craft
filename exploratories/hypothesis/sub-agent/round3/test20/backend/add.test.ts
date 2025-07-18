import { add } from './add';

describe('BACKEND GREAT - add function', () => {
  describe('valid inputs', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add two negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it('should add a positive and negative number', () => {
      expect(add(5, -3)).toBe(2);
    });

    it('should add zero to a number', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
    });

    it('should add decimal numbers', () => {
      expect(add(1.5, 2.5)).toBe(4);
    });

    it('should handle large numbers', () => {
      expect(add(1000000, 2000000)).toBe(3000000);
    });

    it('should handle very small numbers', () => {
      expect(add(0.000001, 0.000002)).toBeCloseTo(0.000003);
    });
  });

  describe('error handling', () => {
    it('should throw error when first argument is not a number', () => {
      expect(() => add('2' as any, 3)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when second argument is not a number', () => {
      expect(() => add(2, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when both arguments are not numbers', () => {
      expect(() => add('2' as any, '3' as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when first argument is NaN', () => {
      expect(() => add(NaN, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is NaN', () => {
      expect(() => add(2, NaN)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when first argument is Infinity', () => {
      expect(() => add(Infinity, 3)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when second argument is Infinity', () => {
      expect(() => add(2, Infinity)).toThrow('Both arguments must be finite numbers');
    });

    it('should throw error when arguments are null', () => {
      expect(() => add(null as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => add(2, null as any)).toThrow('Both arguments must be numbers');
    });

    it('should throw error when arguments are undefined', () => {
      expect(() => add(undefined as any, 3)).toThrow('Both arguments must be numbers');
      expect(() => add(2, undefined as any)).toThrow('Both arguments must be numbers');
    });
  });
});