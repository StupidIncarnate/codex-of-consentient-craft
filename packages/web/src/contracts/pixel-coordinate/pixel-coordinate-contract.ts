/**
 * PURPOSE: Defines a branded string type for pixel art coordinate data in "x y #color" format
 *
 * USAGE:
 * pixelCoordinateContract.parse('5 0 #ff4500');
 * // Returns: PixelCoordinate branded string
 */

import { z } from 'zod';

export const pixelCoordinateContract = z
  .string()
  .regex(/^\d+ \d+ #[0-9a-fA-F]{6}$/u, 'Must be format "x y #color"')
  .brand<'PixelCoordinate'>();

export type PixelCoordinate = z.infer<typeof pixelCoordinateContract>;
