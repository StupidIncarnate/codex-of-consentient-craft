/**
 * PURPOSE: Defines a branded positive integer type for pixel art dimensions
 *
 * USAGE:
 * pixelDimensionContract.parse(8);
 * // Returns: PixelDimension branded number
 */

import { z } from 'zod';

export const pixelDimensionContract = z.number().int().positive().brand<'PixelDimension'>();

export type PixelDimension = z.infer<typeof pixelDimensionContract>;
