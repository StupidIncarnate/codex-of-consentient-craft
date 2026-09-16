import { PNG } from 'pngjs';

import { pngjsDecodeAdapter } from './pngjs-decode-adapter';
import { pngjsDecodeAdapterProxy } from './pngjs-decode-adapter.proxy';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('pngjsDecodeAdapter', () => {
  describe('decoding real PNG bytes', () => {
    it('VALID: {a 2x2 PNG with 4 distinct RGBA pixels} => returns width 2, height 2 and the exact RGBA bytes', () => {
      pngjsDecodeAdapterProxy();
      const png = new PNG({ width: 2, height: 2 });
      const pixels = Buffer.from([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
      ]);
      png.data = pixels;
      const bytes = FileContentsStub({ value: PNG.sync.write(png).toString('latin1') });

      const result = pngjsDecodeAdapter({ bytes });

      expect(result).toStrictEqual({
        width: 2,
        height: 2,
        pixels: new Uint8Array(pixels),
      });
    });
  });

  describe('blank and near-blank fidelity', () => {
    it('VALID: {a 2x2 PNG entirely #0d0907} => decodes to four identical opaque pixels', () => {
      pngjsDecodeAdapterProxy();
      const png = new PNG({ width: 2, height: 2 });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      png.data = Buffer.from([
        ...backgroundPixel,
        ...backgroundPixel,
        ...backgroundPixel,
        ...backgroundPixel,
      ]);
      const bytes = FileContentsStub({ value: PNG.sync.write(png).toString('latin1') });

      const result = pngjsDecodeAdapter({ bytes });

      expect(result).toStrictEqual({
        width: 2,
        height: 2,
        pixels: new Uint8Array([13, 9, 7, 255, 13, 9, 7, 255, 13, 9, 7, 255, 13, 9, 7, 255]),
      });
    });

    it('EDGE: {a 2x2 PNG with one pixel differing from the other three} => decodes the differing byte exactly', () => {
      pngjsDecodeAdapterProxy();
      const png = new PNG({ width: 2, height: 2 });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const foregroundPixel = [0xff, 0xff, 0xff, 255];
      png.data = Buffer.from([
        ...backgroundPixel,
        ...backgroundPixel,
        ...backgroundPixel,
        ...foregroundPixel,
      ]);
      const bytes = FileContentsStub({ value: PNG.sync.write(png).toString('latin1') });

      const result = pngjsDecodeAdapter({ bytes });

      expect(result).toStrictEqual({
        width: 2,
        height: 2,
        pixels: new Uint8Array([13, 9, 7, 255, 13, 9, 7, 255, 13, 9, 7, 255, 255, 255, 255, 255]),
      });
    });
  });

  describe('error cases', () => {
    it("ERROR: {bytes: not a PNG} => throws naming the decoder's own message", () => {
      pngjsDecodeAdapterProxy();
      // Exactly 8 bytes (the PNG signature's own length): pngjs's sync reader throws its own
      // "unrecognised content at end of stream" error instead when leftover bytes remain after a
      // failed signature check, so a clean "Invalid file signature" needs the buffer fully
      // consumed by that first 8-byte read.
      const bytes = FileContentsStub({ value: 'NOTAPNG!' });

      expect(() => pngjsDecodeAdapter({ bytes })).toThrow(
        /^Failed to decode PNG bytes: Invalid file signature$/u,
      );
    });
  });
});
