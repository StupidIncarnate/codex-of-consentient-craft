import { pixelDimensionContract } from './pixel-dimension-contract';
import { PixelDimensionStub } from './pixel-dimension.stub';

describe('pixelDimensionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 1} => parses minimum positive integer', () => {
      const result = pixelDimensionContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 8} => parses typical dimension', () => {
      const result = pixelDimensionContract.parse(8);

      expect(result).toBe(8);
    });

    it('VALID: {value: 64} => parses larger dimension', () => {
      const result = pixelDimensionContract.parse(64);

      expect(result).toBe(64);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 0} => throws for zero', () => {
      expect(() => pixelDimensionContract.parse(0)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => pixelDimensionContract.parse(-1)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => pixelDimensionContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "8"} => throws for string', () => {
      expect(() => pixelDimensionContract.parse('8')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => pixelDimensionContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => pixelDimensionContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid pixel dimension with default value 8', () => {
      const result = PixelDimensionStub();

      expect(result).toBe(8);
    });

    it('VALID: {value: 16} => creates pixel dimension with custom value', () => {
      const result = PixelDimensionStub({ value: 16 });

      expect(result).toBe(16);
    });
  });
});
