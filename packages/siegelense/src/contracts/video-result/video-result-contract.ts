/**
 * PURPOSE: The structured result produced by a video recording action ('start' or 'stop') —
 * carrying the outcome status ('started' or 'stopped') and the path to the recorded video file (null when starting).
 * Reach for this over raw unvalidated objects to ensure video operation outcomes conform to the expected shape.
 *
 * USAGE:
 * videoResultContract.parse({ status: 'started', path: null });
 * // Returns a validated VideoResult
 */

import { z } from 'zod';

export const videoResultContract = z
  .object({
    status: z.string().brand<'VideoStatus'>(),
    path: z.string().brand<'VideoPath'>().nullable(),
  })
  .strict();

export type VideoResult = z.infer<typeof videoResultContract>;
