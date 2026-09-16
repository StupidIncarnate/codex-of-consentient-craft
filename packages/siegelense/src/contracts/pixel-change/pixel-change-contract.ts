/**
 * PURPOSE: The rendered `NN%` form of one acting step's pixel-diff reading against the previous
 * capture taken anywhere in the INSTANCE (siegelense-tooling.md line 691: "the fraction of pixels
 * differing between this capture and the previous one, wherever that was taken"). Reach for this
 * over a raw `z.number()` percentage: the spec's own examples print the string form (`'38%'`,
 * line 2889), and `stepReadingContract.pixelChange` / `shotListingContract.pixelChange` are both
 * `.nullable()` around this contract rather than encoding "no predecessor" as `0` — line 1630's own
 * rule, "`pixelChange` is `null` on a first capture, never `0`".
 *
 * USAGE:
 * pixelChangeContract.parse('38%');
 * // Returns a branded PixelChange
 */

import { z } from 'zod';

export const pixelChangeContract = z
  .string()
  .regex(/^\d{1,3}%$/u)
  .brand<'PixelChange'>();

export type PixelChange = z.infer<typeof pixelChangeContract>;
