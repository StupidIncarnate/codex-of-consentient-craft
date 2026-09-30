/**
 * PURPOSE: The exact geometry of one element, read off the live page by ref — Rung 3 of the reading
 * ladder (siegelense-tooling.md line 634: `look` → `look { within }` → `box` → `dom` → `eval`).
 * Reports bounding coordinates (`x`, `y`, `width`, `height`), viewport dimensions (`width`,
 * `height`), whether the element is considered visible, and whether it intersects the viewport.
 *
 * USAGE:
 * boxReadingContract.parse({
 *   ref: 26,
 *   x: 607,
 *   y: 472,
 *   width: 66,
 *   height: 27,
 *   viewport: { width: 1280, height: 720 },
 *   visible: true,
 *   inViewport: true,
 * });
 * // Returns a validated BoxReading
 */

import { z } from '#gateway/npm/zod';


export const boxReadingContract = z
  .object({
    ref: z.number().int().positive().brand<'BoxReadingRef'>(),
    x: z.number().int().brand<'BoxReadingX'>(),
    y: z.number().int().brand<'BoxReadingY'>(),
    width: z.number().int().nonnegative().brand<'BoxReadingWidth'>(),
    height: z.number().int().nonnegative().brand<'BoxReadingHeight'>(),
    viewport: z
      .object({
        width: z.number().int().nonnegative().brand<'BoxReadingViewportWidth'>(),
        height: z.number().int().nonnegative().brand<'BoxReadingViewportHeight'>(),
      })
      .strict(),
    visible: z.boolean(),
    inViewport: z.boolean(),
  })
  .strict().brand<'BoxReading'>();

export type BoxReading = z.infer<typeof boxReadingContract>;
