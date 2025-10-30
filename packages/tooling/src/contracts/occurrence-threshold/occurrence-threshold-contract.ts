/**
 * PURPOSE: Defines a branded number type for occurrence thresholds (minimum 2) with validation.
 *
 * USAGE:
 * const threshold = occurrenceThresholdContract.parse(3);
 * // Returns: OccurrenceThreshold (branded number >= 2)
 */
import { z } from 'zod';
import { occurrenceCountStatics } from '../../statics/occurrence-count/occurrence-count-statics';

export const occurrenceThresholdContract = z
  .number()
  .int()
  .min(occurrenceCountStatics.minimumForDuplicate)
  .brand<'OccurrenceThreshold'>();

export type OccurrenceThreshold = z.infer<typeof occurrenceThresholdContract>;
