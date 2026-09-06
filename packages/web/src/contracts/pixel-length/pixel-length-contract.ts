/**
 * PURPOSE: Sizes an edge of a pasted photograph in CSS pixels, a value in the thousands that the
 * downscale ladder shrinks. Reach for pixelDimensionContract instead when the number is a pixel-art
 * sprite's grid size, which is single digits and drives a different scale.
 *
 * USAGE:
 * pixelLengthContract.parse(2000);
 * // Returns: PixelLength branded number
 */

import { z } from 'zod';

export const pixelLengthContract = z.number().int().positive().brand<'PixelLength'>();

export type PixelLength = z.infer<typeof pixelLengthContract>;
