import { pixelChangeContract } from './pixel-change-contract';
import { PixelChangeStub } from './pixel-change.stub';

describe('pixelChangeContract', () => {
  describe('valid readings', () => {
    it('VALID: {value: "0%"} => parses successfully', () => {
      const pixelChange = PixelChangeStub({ value: '0%' });

      const result = pixelChangeContract.parse(pixelChange);

      expect(result).toBe('0%');
    });

    it('VALID: {value: "38%"} => parses successfully', () => {
      const pixelChange = PixelChangeStub({ value: '38%' });

      const result = pixelChangeContract.parse(pixelChange);

      expect(result).toBe('38%');
    });

    it('VALID: {value: "100%"} => parses successfully', () => {
      const pixelChange = PixelChangeStub({ value: '100%' });

      const result = pixelChangeContract.parse(pixelChange);

      expect(result).toBe('100%');
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {value: "38"} => a missing percent sign throws validation error', () => {
      expect(() => {
        pixelChangeContract.parse('38');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "0.5"} => a decimal fraction throws validation error', () => {
      expect(() => {
        pixelChangeContract.parse('0.5');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "-1%"} => a negative percentage throws validation error', () => {
      expect(() => {
        pixelChangeContract.parse('-1%');
      }).toThrow(/Invalid/u);
    });
  });
});
