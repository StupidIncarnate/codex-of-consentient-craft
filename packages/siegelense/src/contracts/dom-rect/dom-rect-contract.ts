/**
 * PURPOSE: The bounding client rect of one element returned by `dom` step readings.
 * Uses pixelCoordinateContract for x/y and pixelCountContract for width/height.
 *
 * USAGE:
 * domRectContract.parse({ x: 10, y: 20, width: 100, height: 50 });
 * // Returns a validated DomRect
 */

import { z } from 'zod';

import { pixelCoordinateContract } from '../pixel-coordinate/pixel-coordinate-contract';
import { pixelCountContract } from '../pixel-count/pixel-count-contract';

export const domRectContract = z
  .object({
    x: pixelCoordinateContract,
    y: pixelCoordinateContract,
    width: pixelCountContract,
    height: pixelCountContract,
  })
  .strict();

export type DomRect = z.infer<typeof domRectContract>;
