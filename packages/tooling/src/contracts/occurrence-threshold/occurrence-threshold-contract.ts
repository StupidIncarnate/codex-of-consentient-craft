import { z } from 'zod';

export const occurrenceThresholdContract = z.number().int().min(2).brand<'OccurrenceThreshold'>();

export type OccurrenceThreshold = z.infer<typeof occurrenceThresholdContract>;
