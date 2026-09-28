/**
 * PURPOSE: Decodes PNG bytes into a validated `DecodedFrame` via `PNG.sync.read` — one of the two
 * files in this package allowed to import `pngjs` or `pixelmatch` (chunk-03-read-path-and-perception.md
 * W6). Pinned to pngjs `^6`, never `^7`: `pixelmatch@5` itself depends on `pngjs@^6`, so a `^7`
 * install would sit alongside pixelmatch's own copy rather than sharing it, and `@types/pngjs` stops
 * publishing types past 6.0.5. `bytes` is the raw file content as read by `readFileBytes`: a PNG is
 * binary, and any string round trip (UTF-8 in particular) corrupts it.
 *
 * USAGE:
 * pngjsDecodeAdapter({ bytes: await readFileBytes(shotPath) });
 * // Returns a validated DecodedFrame: { width, height, pixels }
 */

import { PNG } from '#gateway/npm/pngjs';

import { decodedFrameContract } from '../../../contracts/decoded-frame/decoded-frame-contract';
import { pixelCountContract } from '../../../contracts/pixel-count/pixel-count-contract';
import type { DecodedFrame } from '../../../contracts/decoded-frame/decoded-frame-contract';

export const pngjsDecodeAdapter = ({ bytes }: { bytes: Uint8Array }): DecodedFrame => {
  try {
    const decoded = PNG.sync.read(Buffer.from(bytes));

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
