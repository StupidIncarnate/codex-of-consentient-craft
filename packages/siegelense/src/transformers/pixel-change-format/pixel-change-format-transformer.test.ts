import { pixelChangeFormatTransformer } from './pixel-change-format-transformer';

describe('pixelChangeFormatTransformer', () => {
  it('VALID: {1036 of 921600} => "0.11% (1036 px)", the text-line change a whole percent hid', () => {
    const result = pixelChangeFormatTransformer({
      diffCount: 1036,
      totalPixels: 921600,
    });

    expect(result).toBe('0.11% (1036 px)');
  });

  it('VALID: {0 of 921600} => "0 px"', () => {
    const result = pixelChangeFormatTransformer({
      diffCount: 0,
      totalPixels: 921600,
    });

    expect(result).toBe('0 px');
  });

  it('EDGE: {1 of 921600} => "<0.01% (1 px)", a real change never reads as none', () => {
    const result = pixelChangeFormatTransformer({
      diffCount: 1,
      totalPixels: 921600,
    });

    expect(result).toBe('<0.01% (1 px)');
  });

  it('VALID: {921600 of 921600} => "100.00% (921600 px)"', () => {
    const result = pixelChangeFormatTransformer({
      diffCount: 921600,
      totalPixels: 921600,
    });

    expect(result).toBe('100.00% (921600 px)');
  });
});
