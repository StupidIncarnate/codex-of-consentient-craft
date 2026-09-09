/**
 * PURPOSE: One elapsed time span, already split into whole hours, minutes and seconds. Produced
 * once and handed to a single formatting function whether the work item it measures is still
 * running or has already finished. `seconds` is carried even though no display band renders it —
 * the under-a-minute branch that decides between showing `<1m` and a minutes count is decided
 * on it.
 *
 * USAGE:
 * elapsedPartsContract.parse({hours: 0, minutes: 5, seconds: 30});
 * // Returns a branded ElapsedParts object
 */

import { z } from 'zod';

import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

export const elapsedPartsContract = z.object({
  hours: z.number().int().min(0).brand<'ElapsedHours'>(),
  minutes: z
    .number()
    .int()
    .min(0)
    .max(elapsedDisplayConfigStatics.thresholds.hourThresholdMinutes - 1)
    .brand<'ElapsedMinutes'>(),
  seconds: z
    .number()
    .int()
    .min(0)
    .max(elapsedDisplayConfigStatics.thresholds.minuteThresholdSeconds - 1)
    .brand<'ElapsedSeconds'>(),
});

export type ElapsedParts = z.infer<typeof elapsedPartsContract>;
