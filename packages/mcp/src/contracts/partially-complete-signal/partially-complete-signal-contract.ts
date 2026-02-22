/**
 * PURPOSE: Defines the schema for a partially-complete signal sent when a step is partially done
 *
 * USAGE:
 * const signal = partiallyCompleteSignalContract.parse({ signal: 'partially-complete', stepId: '...', progress: '...', continuationPoint: '...' });
 * // Returns validated partially-complete signal
 */
import { z } from 'zod';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

export const partiallyCompleteSignalContract = z.object({
  signal: z.literal('partially-complete').brand<'PartiallyCompleteSignalType'>(),
  stepId: stepIdContract,
  progress: z.string().min(1).brand<'SignalProgress'>(),
  continuationPoint: z.string().min(1).brand<'SignalContinuationPoint'>(),
});

export type PartiallyCompleteSignal = z.infer<typeof partiallyCompleteSignalContract>;
