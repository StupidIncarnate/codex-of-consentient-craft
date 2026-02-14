/**
 * PURPOSE: Defines a branded number type for CSS pixel values
 *
 * USAGE:
 * const px: CssPixels = cssPixelsContract.parse(16);
 * // Returns a branded CssPixels number type
 */
import { z } from 'zod';

export const cssPixelsContract = z.number().int().nonnegative().brand<'CssPixels'>();

export type CssPixels = z.infer<typeof cssPixelsContract>;
