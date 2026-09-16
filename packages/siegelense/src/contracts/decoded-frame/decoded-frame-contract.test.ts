import { decodedFrameContract } from './decoded-frame-contract';
import { DecodedFrameStub } from './decoded-frame.stub';

describe('decodedFrameContract', () => {
  describe('valid frames', () => {
    it('VALID: {width: 2, height: 2, pixels: 16-byte RGBA} => parses the complete frame', () => {
      const pixels = new Uint8Array(16).fill(9);

      const result = decodedFrameContract.parse(DecodedFrameStub({ width: 2, height: 2, pixels }));

      expect(result).toStrictEqual({ width: 2, height: 2, pixels });
    });

    it('EDGE: {width: 0, height: 0, pixels: empty} => parses a zero-size frame', () => {
      const pixels = new Uint8Array(0);

      const result = decodedFrameContract.parse(DecodedFrameStub({ width: 0, height: 0, pixels }));

      expect(result).toStrictEqual({ width: 0, height: 0, pixels });
    });
  });

  describe('invalid frames', () => {
    it('INVALID: {pixels: a plain array, not a Uint8Array} => throws validation error', () => {
      expect(() =>
        decodedFrameContract.parse({
          width: 1,
          height: 1,
          pixels: [0, 0, 0, 255],
        } as never),
      ).toThrow(/Input not instance of Uint8Array/u);
    });

    it('INVALID: {missing width} => throws validation error', () => {
      expect(() =>
        decodedFrameContract.parse({
          height: 1,
          pixels: new Uint8Array(4),
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a single opaque black pixel', () => {
      const result = DecodedFrameStub();

      expect(result).toStrictEqual({
        width: 1,
        height: 1,
        pixels: new Uint8Array([0, 0, 0, 255]),
      });
    });
  });
});
