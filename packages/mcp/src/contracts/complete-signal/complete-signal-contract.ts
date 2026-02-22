/**
 * PURPOSE: Defines the schema for a complete signal sent when a step is finished
 *
 * USAGE:
 * const signal = completeSignalContract.parse({ signal: 'complete', stepId: '...', summary: '...' });
 * // Returns validated complete signal
 */
import { z } from 'zod';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

export const completeSignalContract = z.object({
  signal: z.literal('complete').brand<'CompleteSignalType'>(),
  stepId: stepIdContract,
  summary: z.string().min(1).brand<'SignalSummary'>(),
});

export type CompleteSignal = z.infer<typeof completeSignalContract>;
