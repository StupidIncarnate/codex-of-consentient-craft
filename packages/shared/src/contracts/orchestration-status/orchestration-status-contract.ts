/**
 * PURPOSE: Defines the orchestration status structure for tracking quest execution progress
 *
 * USAGE:
 * orchestrationStatusContract.parse({processId: 'proc-123', questId: 'add-auth', phase: 'codeweaver', ...});
 * // Returns: OrchestrationStatus object
 */

import { z } from 'zod';

import { orchestrationSlotContract } from '../orchestration-slot/orchestration-slot-contract';

export const orchestrationStatusContract = z.object({
  processId: z.string().brand<'ProcessId'>(),
  questId: z.string().brand<'QuestId'>(),
  phase: z.enum([
    'pathseeker',
    'codeweaver',
    'siegemaster',
    'lawbringer',
    'spiritmender',
    'idle',
    'complete',
  ]),
  completed: z.number().int().nonnegative().brand<'CompletedCount'>(),
  total: z.number().int().nonnegative().brand<'TotalCount'>(),
  currentStep: z.string().brand<'StepName'>().optional(),
  slots: z.array(orchestrationSlotContract),
});

export type OrchestrationStatus = z.infer<typeof orchestrationStatusContract>;
