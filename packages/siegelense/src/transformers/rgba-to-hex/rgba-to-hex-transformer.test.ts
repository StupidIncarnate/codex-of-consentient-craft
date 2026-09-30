import { rgbaToHexTransformer } from './rgba-to-hex-transformer';

describe('rgbaToHexTransformer', () => {
  describe.each([
    [0, 0, 0, '#000000'],
    [255, 255, 255, '#ffffff'],
    [13, 9, 7, '#0d0907'],
  ])('channels (%i, %i, %i)', (red, green, blue, expected) => {
    it(`VALID: {red: ${String(red)}, green: ${String(green)}, blue: ${String(blue)}} => returns '${expected}'`, () => {
      const result = rgbaToHexTransformer({
        red,
        green,
        blue,
      });

      expect(result).toBe(expected);
    });
  });
});
