/**
 * PURPOSE: The width or height of a decoded image frame, in pixels — one axis of a `DecodedFrame`,
 * never a tally of pixels across a whole frame. Reach for this over `ReadingCount`: `ReadingCount`
 * counts how many pixels DIFFER between two frames, while `PixelCount` measures one SIDE of a
 * single frame and is what `pixelmatchCompareAdapter` compares axis-by-axis before it ever calls
 * pixelmatch, so a size mismatch is caught as a `PixelCount` inequality rather than surfacing as
 * pixelmatch's own generic "Image sizes do not match" error.
 *
 * USAGE:
 * pixelCountContract.parse(1280);
 * // Returns a branded PixelCount
 */

import { z } from 'zod';

export const pixelCountContract = z.number().int().nonnegative().brand<'PixelCount'>();

export type PixelCount = z.infer<typeof pixelCountContract>;
