/**
 * PURPOSE: A coordinate along the x or y axis in pixels, relative to the viewport. May be negative
 * when an element is positioned or scrolled offscreen to the left or top.
 *
 * USAGE:
 * pixelCoordinateContract.parse(607);
 * // Returns a branded PixelCoordinate
 *
 * pixelCoordinateContract.parse(-25);
 * // Returns a branded PixelCoordinate for an offscreen position
 */

import { z } from 'zod';

export const pixelCoordinateContract = z.number().int().brand<'PixelCoordinate'>();

export type PixelCoordinate = z.infer<typeof pixelCoordinateContract>;
