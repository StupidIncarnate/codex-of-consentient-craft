/**
 * PURPOSE: Decodes PNG bytes into a validated `DecodedFrame` via `PNG.sync.read` — one of the two
 * files in this package allowed to import `pngjs` or `pixelmatch` (chunk-03-read-path-and-perception.md
 * W6). Pinned to pngjs `^6`, never `^7`: `pixelmatch@5` itself depends on `pngjs@^6`, so a `^7`
 * install would sit alongside pixelmatch's own copy rather than sharing it, and `@types/pngjs` stops
 * publishing types past 6.0.5. `bytes` arrives as a `FileContents` string rather than a `Buffer`
 * because the caller reads the PNG file through the same string-shaped contract every other file
 * read uses; this adapter converts back to bytes via `latin1`, the one string encoding that maps
 * each 8-bit byte to a single code unit and round-trips arbitrary binary data losslessly — as long
 * as the string was produced with that same encoding.
 *
 * USAGE:
 * pngjsDecodeAdapter({ bytes: FileContentsStub({ value: pngBuffer.toString('latin1') }) });
 * // Returns a validated DecodedFrame: { width, height, pixels }
 */

import { PNG } from 'pngjs';

import { decodedFrameContract } from '../../../contracts/decoded-frame/decoded-frame-contract';
import { pixelCountContract } from '../../../contracts/pixel-count/pixel-count-contract';
import type { DecodedFrame } from '../../../contracts/decoded-frame/decoded-frame-contract';
import type { FileContents } from '@dungeonmaster/shared/contracts';

const BINARY_ENCODING = 'latin1';

export const pngjsDecodeAdapter = ({ bytes }: { bytes: FileContents }): DecodedFrame => {
  try {
    const decoded = PNG.sync.read(Buffer.from(bytes, BINARY_ENCODING));

    return decodedFrameContract.parse({
      width: pixelCountContract.parse(decoded.width),
      height: pixelCountContract.parse(decoded.height),
      // Copied rather than passed through: `decoded.data` is a Buffer (a Uint8Array subclass)
      // that may share pngjs's own pooled ArrayBuffer, and DecodedFrame must own its bytes.
      pixels: new Uint8Array(decoded.data),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to decode PNG bytes: ${reason}`, { cause: error });
  }
};
