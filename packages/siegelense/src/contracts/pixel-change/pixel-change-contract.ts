/**
 * PURPOSE: The rendered form of one acting step's pixel-diff reading against the previous
 * capture taken anywhere in the INSTANCE (siegelense-tooling.md line 691: "the fraction of pixels
 * differing between this capture and the previous one, wherever that was taken"). It carries the
 * changed-pixel COUNT beside a two-decimal share (`0.11% (1036 px)`), `<0.01% (1 px)` for a share
 * under the floor, and `0 px` only for identical frames, so a small change never reads as none.
 * A stored reading may also hold a bare whole percent (`38%`), which parses as well. Reach for
 * this over a raw `z.number()` percentage: `stepReadingContract.pixelChange` /
 * `shotListingContract.pixelChange` are both `.nullable()` around this contract rather than
 * encoding "no predecessor" as `0` — line 1630's own rule, "`pixelChange` is `null` on a first
 * capture, never `0`".
 *
 * USAGE:
 * pixelChangeContract.parse('0.11% (1036 px)');
 * // Returns a branded PixelChange
 */

import { z } from 'zod';

export const pixelChangeContract = z
  .string()
  .regex(/^(?:0 px|(?:<0\.01|\d{1,3}(?:\.\d{2})?)% \(\d+ px\)|\d{1,3}%)$/u)
  .brand<'PixelChange'>();

export type PixelChange = z.infer<typeof pixelChangeContract>;
