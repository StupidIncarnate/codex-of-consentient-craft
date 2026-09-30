/**
 * PURPOSE: Defines the orchestration status structure for tracking quest execution progress
 *
 * USAGE:
 * orchestrationStatusContract.parse({processId: 'proc-123', questId: 'add-auth', phase: 'codeweaver', ...});
 * // Returns: OrchestrationStatus object
 */

import { z } from '#gateway/npm/zod';

import { orchestrationSlotContract } from '../orchestration-slot/orchestration-slot-contract';
import { questContract } from '../quest/quest-contract';

export const orchestrationStatusContract = z.object({
  processId: z.string().brand<'OrchestrationStatusProcessId'>(),
  questId: questContract.shape.id,
  phase: z.enum([
    'codeweaver',
    'flowrider',
    'siegemaster',
    'spiritmender',
    'ward',
    'idle',
    'complete',
    'failed',
  ]),
  completed: z.number().int().nonnegative().brand<'CompletedCount'>(),
  total: z.number().int().nonnegative().brand<'TotalCount'>(),
  currentStep: z.string().brand<'OrchestrationStatusCurrentStep'>().optional(),
  slots: z.array(orchestrationSlotContract),
});

export type OrchestrationStatus = z.infer<typeof orchestrationStatusContract>;
