import { pixelCountContract } from './pixel-count-contract';
import { PixelCountStub } from './pixel-count.stub';

describe('pixelCountContract', () => {
  it('VALID: {value: 1280} => parses and returns branded PixelCount', () => {
    const result = PixelCountStub({ value: 1280 });

    expect(result).toBe(1280);
  });

  it('INVALID: {value: -1} => throws for a negative count', () => {
    expect(() => pixelCountContract.parse(-1)).toThrow(/expected number to be >=0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => pixelCountContract.parse(1.5)).toThrow(/expected int, received number/u);
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = PixelCountStub({ value: 0 });

    expect(result).toBe(0);
  });
});
