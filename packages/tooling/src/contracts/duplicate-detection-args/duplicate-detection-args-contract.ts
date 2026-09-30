/**
 * PURPOSE: The parsed options of the duplicate-primitive CLI. `threshold` keeps the floor of two
 * occurrences: a literal seen once is not a duplicate, so a lower value is rejected where the flag
 * enters.
 *
 * USAGE:
 * const args = duplicateDetectionArgsContract.parse({ threshold: 3 });
 * // Returns: DuplicateDetectionArgs with a threshold of at least 2
 */
import { z } from '#gateway/npm/zod';
import { occurrenceCountStatics } from '../../statics/occurrence-count/occurrence-count-statics';

export const duplicateDetectionArgsContract = z
  .object({
    threshold: z
      .number()
      .int()
      .min(occurrenceCountStatics.minimumForDuplicate)
      .brand<'DuplicateDetectionArgsThreshold'>(),
  })
  .brand<'DuplicateDetectionArgs'>();

export type DuplicateDetectionArgs = z.infer<typeof duplicateDetectionArgsContract>;
