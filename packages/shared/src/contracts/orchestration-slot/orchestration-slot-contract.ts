/**
 * PURPOSE: Defines the structure of an orchestration slot for tracking agent execution
 *
 * USAGE:
 * orchestrationSlotContract.parse({slotId: 0, status: 'running', step: 'Create user model'});
 * // Returns: OrchestrationSlot object
 */

import { z } from 'zod';

export const orchestrationSlotContract = z.object({
  slotId: z.number().int().nonnegative().brand<'SlotId'>(),
  step: z.string().brand<'StepName'>().optional(),
  status: z.enum(['idle', 'running', 'completed', 'failed']),
});

export type OrchestrationSlot = z.infer<typeof orchestrationSlotContract>;
