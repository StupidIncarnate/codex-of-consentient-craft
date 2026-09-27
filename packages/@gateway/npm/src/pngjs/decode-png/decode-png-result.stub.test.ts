import { DecodePngResultStub } from './decode-png-result.stub';

describe('DecodePngResultStub', () => {
  it('VALID: {} => the real decoded 2x2 solid red PNG', () => {
    const decoded = DecodePngResultStub();

    expect({
      width: decoded.width,
      height: decoded.height,
      pixels: Array.from(decoded.pixels),
    }).toStrictEqual({
      width: 2,
      height: 2,
      pixels: [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255],
    });
  });
});
