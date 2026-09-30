/**
 * PURPOSE: The structured reading returned by the `hold` step verb — captures N frames at an
 * interval and records total frames captured, count of differing frames, the 1-based number of
 * each frame whose pixels differ from the frame before it, verdict summary, and the captured shot
 * file paths.
 *
 * USAGE:
 * holdReadingContract.parse({ frames: 4, differing: 0, changed: [], verdict: 'NOTHING CHANGED across 4.5s', shots: [...] });
 * // Returns a validated HoldReading
 */

import { z } from '#gateway/npm/zod';
import { holdStatics } from '../../statics/hold/hold-statics';

export const holdReadingContract = z
  .object({
    frames: z.number().int().min(holdStatics.defaults.minFrames).brand<'HoldReadingFrames'>(),
    differing: z.number().int().nonnegative().brand<'HoldReadingDiffering'>(),
    changed: z.array(z.number().int().positive().brand<'HoldReadingChanged'>()),
    verdict: z.string().brand<'HoldReadingVerdict'>(),
    shots: z.array(z.string().brand<'HoldReadingShots'>()),
  })
  .strict()
  .brand<'HoldReading'>();

export type HoldReading = z.infer<typeof holdReadingContract>;
