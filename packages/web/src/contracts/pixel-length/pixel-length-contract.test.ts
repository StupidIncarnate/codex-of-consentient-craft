import { pixelLengthContract } from './pixel-length-contract';
import { PixelLengthStub } from './pixel-length.stub';

describe('pixelLengthContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 2000} => parses positive integer', () => {
      const result = pixelLengthContract.parse(2000);

      expect(result).toBe(2000);
    });
  });

  describe('invalid inputs', () => {
    it('EDGE: {value: 0} => throws for a zero edge', () => {
      expect(() => pixelLengthContract.parse(0)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => pixelLengthContract.parse(-1)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => pixelLengthContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid pixel length with default value 2000', () => {
      const result = PixelLengthStub();

      expect(result).toBe(2000);
    });

    it('VALID: {value: 3000} => creates pixel length with custom value', () => {
      const result = PixelLengthStub({ value: 3000 });

      expect(result).toBe(3000);
    });
  });
});
