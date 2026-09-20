import { pixelCoordinateContract } from './pixel-coordinate-contract';
import { PixelCoordinateStub } from './pixel-coordinate.stub';

describe('pixelCoordinateContract', () => {
  it('VALID: {value: 607} => parses positive coordinate and returns branded PixelCoordinate', () => {
    const result = PixelCoordinateStub({ value: 607 });

    expect(result).toBe(607);
  });

  it('VALID: {value: -25} => parses negative coordinate for offscreen element', () => {
    const result = PixelCoordinateStub({ value: -25 });

    expect(result).toBe(-25);
  });

  it('VALID: {value: 0} => parses zero coordinate', () => {
    const result = PixelCoordinateStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer float', () => {
    expect(() => pixelCoordinateContract.parse(1.5)).toThrow(/Expected integer, received float/u);
  });
});
