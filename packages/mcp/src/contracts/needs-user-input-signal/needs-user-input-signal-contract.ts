/**
 * PURPOSE: Defines the schema for a needs-user-input signal sent when a step requires user input
 *
 * USAGE:
 * const signal = needsUserInputSignalContract.parse({ signal: 'needs-user-input', stepId: '...', question: '...', context: '...' });
 * // Returns validated needs-user-input signal
 */
import { z } from 'zod';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

export const needsUserInputSignalContract = z.object({
  signal: z.literal('needs-user-input').brand<'NeedsUserInputSignalType'>(),
  stepId: stepIdContract,
  question: z.string().min(1).brand<'SignalQuestion'>(),
  context: z.string().min(1).brand<'SignalContext'>(),
});

export type NeedsUserInputSignal = z.infer<typeof needsUserInputSignalContract>;
