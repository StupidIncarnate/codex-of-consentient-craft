import { PNG } from 'pngjs';
import { decodePng } from './decode-png';
import { decodePngProxy } from './decode-png.proxy';

describe('decodePng', () => {
  it('VALID: {a 2x2 PNG with 4 distinct RGBA pixels} => returns width 2, height 2 and the exact RGBA bytes', () => {
    decodePngProxy();
    const png = new PNG({ width: 2, height: 2 });
    const pixels = Buffer.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
    png.data = pixels;

    const result = decodePng({ bytes: PNG.sync.write(png) });

    expect(result).toStrictEqual({
      width: 2,
      height: 2,
      pixels: new Uint8Array(pixels),
    });
  });

  it("ERROR: {bytes: not a PNG} => throws naming the decoder's own message", () => {
    decodePngProxy();
    // Exactly 8 bytes (the PNG signature's own length): pngjs's sync reader throws its own
    // "unrecognised content at end of stream" error instead when leftover bytes remain after a
    // failed signature check, so a clean "Invalid file signature" needs the buffer fully
    // consumed by that first 8-byte read.
    const bytes = Buffer.from('NOTAPNG!', 'latin1');

    expect(() => decodePng({ bytes })).toThrow(
      /^Failed to decode PNG bytes: Invalid file signature$/u,
    );
  });

  it("EMPTY: {bytes: an empty buffer} => throws naming the decoder's own message", () => {
    decodePngProxy();

    expect(() => decodePng({ bytes: Buffer.alloc(0) })).toThrow(
      /^Failed to decode PNG bytes: There are some read requests waitng on finished stream$/u,
    );
  });
});
