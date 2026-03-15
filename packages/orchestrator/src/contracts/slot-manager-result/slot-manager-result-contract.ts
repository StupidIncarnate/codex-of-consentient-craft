/**
 * PURPOSE: Defines the result type for slot manager orchestration
 *
 * USAGE:
 * slotManagerResultContract.parse({completed: true});
 * // Returns validated SlotManagerResult
 */

import { z } from 'zod';

import { workItemIdContract } from '../work-item-id/work-item-id-contract';

const slotManagerResultCompletedContract = z.object({
  completed: z.literal(true),
});

const slotManagerResultIncompleteContract = z.object({
  completed: z.literal(false),
  incompleteIds: z.array(workItemIdContract),
  failedIds: z.array(workItemIdContract),
});

export const slotManagerResultContract = z.discriminatedUnion('completed', [
  slotManagerResultCompletedContract,
  slotManagerResultIncompleteContract,
]);

export type SlotManagerResult = z.infer<typeof slotManagerResultContract>;
