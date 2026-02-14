import { pixelCoordinateContract } from './pixel-coordinate-contract';
import { PixelCoordinateStub } from './pixel-coordinate.stub';

describe('pixelCoordinateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "5 0 #ff4500"} => parses coordinate with color', () => {
      const result = pixelCoordinateContract.parse('5 0 #ff4500');

      expect(result).toBe('5 0 #ff4500');
    });

    it('VALID: {value: "0 0 #000000"} => parses zero coordinates', () => {
      const result = pixelCoordinateContract.parse('0 0 #000000');

      expect(result).toBe('0 0 #000000');
    });

    it('VALID: {value: "100 200 #AABBCC"} => parses uppercase hex', () => {
      const result = pixelCoordinateContract.parse('100 200 #AABBCC');

      expect(result).toBe('100 200 #AABBCC');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "5 0"} => throws for missing color', () => {
      expect(() => pixelCoordinateContract.parse('5 0')).toThrow(/Must be format/u);
    });

    it('INVALID_VALUE: {value: "5 0 ff4500"} => throws for missing hash', () => {
      expect(() => pixelCoordinateContract.parse('5 0 ff4500')).toThrow(/Must be format/u);
    });

    it('INVALID_VALUE: {value: "5 #ff4500"} => throws for missing y coordinate', () => {
      expect(() => pixelCoordinateContract.parse('5 #ff4500')).toThrow(/Must be format/u);
    });

    it('INVALID_VALUE: {value: "-1 0 #ff4500"} => throws for negative coordinate', () => {
      expect(() => pixelCoordinateContract.parse('-1 0 #ff4500')).toThrow(/Must be format/u);
    });

    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => pixelCoordinateContract.parse('')).toThrow(/Must be format/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => pixelCoordinateContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => pixelCoordinateContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid pixel coordinate', () => {
      const result = PixelCoordinateStub();

      expect(result).toBe('5 0 #ff4500');
    });

    it('VALID: {value: "10 20 #00ff00"} => creates coordinate with custom value', () => {
      const result = PixelCoordinateStub({ value: '10 20 #00ff00' });

      expect(result).toBe('10 20 #00ff00');
    });
  });
});
