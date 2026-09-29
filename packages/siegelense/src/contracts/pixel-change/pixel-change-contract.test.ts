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

  describe('count-bearing readings', () => {
    it.each(['0 px', '0.11% (1036 px)', '<0.01% (1 px)', '100.00% (921600 px)'])(
      'VALID: {value: %s} => parses successfully',
      (value) => {
        const result = pixelChangeContract.parse(PixelChangeStub({ value }));

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid readings', () => {
    it('INVALID: {value: "0.11%"} => a share without its pixel count throws validation error', () => {
      expect(() => {
        pixelChangeContract.parse('0.11%');
      }).toThrow(/Invalid/u);
    });

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
