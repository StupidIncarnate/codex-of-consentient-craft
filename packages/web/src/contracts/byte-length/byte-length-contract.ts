/**
 * PURPOSE: Sizes the decoded output of the browser's downscale ladder for a pasted image, which is
 * what the per-message byte total is counted against. Reach for this over pixelLengthContract when
 * the number measures a size in bytes rather than an edge in pixels.
 *
 * USAGE:
 * byteLengthContract.parse(1024);
 * // Returns: ByteLength branded number
 */

import { z } from 'zod';

export const byteLengthContract = z.number().int().nonnegative().brand<'ByteLength'>();

export type ByteLength = z.infer<typeof byteLengthContract>;
