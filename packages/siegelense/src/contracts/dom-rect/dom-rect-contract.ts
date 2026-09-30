/**
 * PURPOSE: The bounding client rect of one element returned by `dom` step readings.
 * Uses pixelCoordinateContract for x/y and pixelCountContract for width/height.
 *
 * USAGE:
 * domRectContract.parse({ x: 10, y: 20, width: 100, height: 50 });
 * // Returns a validated DomRect
 */

import { z } from '#gateway/npm/zod';


export const domRectContract = z
  .object({
    x: z.number().int().brand<'DomRectX'>(),
    y: z.number().int().brand<'DomRectY'>(),
    width: z.number().int().nonnegative().brand<'DomRectWidth'>(),
    height: z.number().int().nonnegative().brand<'DomRectHeight'>(),
  })
  .strict();

export type DomRect = z.infer<typeof domRectContract>;
