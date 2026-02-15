/**
 * PURPOSE: Defines a branded number type for vertical bounce offset pixel values in sprite animations
 *
 * USAGE:
 * bounceOffsetPxContract.parse(-4);
 * // Returns: BounceOffsetPx branded number
 */

import { z } from 'zod';

export const bounceOffsetPxContract = z.number().int().brand<'BounceOffsetPx'>();

export type BounceOffsetPx = z.infer<typeof bounceOffsetPxContract>;
