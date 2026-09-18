/**
 * PURPOSE: The structured reading returned by the `hold` step verb — captures N frames at an
 * interval and records total frames captured, count of differing frames, verdict summary, and
 * the captured shot file paths.
 *
 * USAGE:
 * holdReadingContract.parse({ frames: 4, differing: 0, verdict: 'NOTHING CHANGED across 4.5s', shots: [...] });
 * // Returns a validated HoldReading
 */

import { z } from 'zod';
import { holdStatics } from '../../statics/hold/hold-statics';

export const holdReadingContract = z
  .object({
    frames: z.number().int().min(holdStatics.defaults.minFrames).brand<'HoldFrames'>(),
    differing: z.number().int().nonnegative().brand<'HoldDiffering'>(),
    verdict: z.string().brand<'HoldVerdict'>(),
    shots: z.array(z.string().brand<'HoldShotPath'>()),
  })
  .strict();

export type HoldReading = z.infer<typeof holdReadingContract>;
