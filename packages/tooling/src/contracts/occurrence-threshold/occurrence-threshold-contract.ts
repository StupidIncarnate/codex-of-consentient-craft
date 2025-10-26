import { z } from 'zod';
import { occurrenceCountStatics } from '../../statics/occurrence-count/occurrence-count-statics';

export const occurrenceThresholdContract = z
  .number()
  .int()
  .min(occurrenceCountStatics.minimumForDuplicate)
  .brand<'OccurrenceThreshold'>();

export type OccurrenceThreshold = z.infer<typeof occurrenceThresholdContract>;
