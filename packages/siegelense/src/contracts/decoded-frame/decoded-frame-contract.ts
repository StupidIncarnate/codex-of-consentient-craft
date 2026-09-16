/**
 * PURPOSE: The RGBA pixel buffer and dimensions `pngjsDecodeAdapter` produces from PNG bytes,
 * validated once at that adapter's own boundary so nothing downstream ever holds a `PNG` instance
 * (chunk-03-read-path-and-perception.md W6: "a decoded frame leaves as a contract, never as a PNG
 * instance"). `pixels` stays a raw `z.instanceof(Uint8Array)` rather than a branded type: pixelmatch
 * reads it as a plain typed array by byte offset, and branding a `Uint8Array` would not change how
 * those bytes compare.
 *
 * USAGE:
 * decodedFrameContract.parse({ width: 2, height: 2, pixels: new Uint8Array(16) });
 * // Returns a validated DecodedFrame
 */

import { z } from 'zod';

import { pixelCountContract } from '../pixel-count/pixel-count-contract';

export const decodedFrameContract = z.object({
  width: pixelCountContract,
  height: pixelCountContract,
  pixels: z.instanceof(Uint8Array),
});

export type DecodedFrame = z.infer<typeof decodedFrameContract>;
