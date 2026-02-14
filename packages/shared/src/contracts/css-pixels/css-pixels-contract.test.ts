import { cssPixelsContract } from './css-pixels-contract';
import { CssPixelsStub } from './css-pixels.stub';

describe('cssPixelsContract', () => {
  describe('valid pixel values', () => {
    it('VALID: 16 => parses to CssPixels branded type', () => {
      const result = cssPixelsContract.parse(16);

      expect(result).toBe(16);
    });

    it('VALID: 0 => parses zero to CssPixels branded type', () => {
      const result = cssPixelsContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: 1920 => parses large value to CssPixels branded type', () => {
      const result = cssPixelsContract.parse(1920);

      expect(result).toBe(1920);
    });
  });

  describe('invalid pixel values', () => {
    it('ERROR: -1 => throws for negative number', () => {
      expect(() => cssPixelsContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('ERROR: 1.5 => throws for non-integer', () => {
      expect(() => cssPixelsContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });

    it('ERROR: "16" => throws for string', () => {
      expect(() => cssPixelsContract.parse('16')).toThrow(/Expected number, received string/u);
    });
  });

  describe('stub', () => {
    it('VALID: CssPixelsStub() => returns default stub value', () => {
      const result = CssPixelsStub();

      expect(result).toBe(16);
    });

    it('VALID: CssPixelsStub({value: 24}) => returns custom value', () => {
      const result = CssPixelsStub({ value: 24 });

      expect(result).toBe(24);
    });
  });
});
