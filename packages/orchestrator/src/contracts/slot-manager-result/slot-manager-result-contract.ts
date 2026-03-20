/**
 * PURPOSE: Defines the result type for slot manager orchestration
 *
 * USAGE:
 * slotManagerResultContract.parse({completed: true});
 * // Returns validated SlotManagerResult
 */

import { z } from 'zod';

import { sessionIdContract } from '@dungeonmaster/shared/contracts';

import { workItemIdContract } from '../work-item-id/work-item-id-contract';

const sessionIdsField = z.record(workItemIdContract, sessionIdContract).default({});

const slotManagerResultCompletedContract = z.object({
  completed: z.literal(true),
  sessionIds: sessionIdsField,
});

const slotManagerResultIncompleteContract = z.object({
  completed: z.literal(false),
  incompleteIds: z.array(workItemIdContract),
  failedIds: z.array(workItemIdContract),
  sessionIds: sessionIdsField,
});

export const slotManagerResultContract = z.discriminatedUnion('completed', [
  slotManagerResultCompletedContract,
  slotManagerResultIncompleteContract,
]);

export type SlotManagerResult = z.infer<typeof slotManagerResultContract>;
