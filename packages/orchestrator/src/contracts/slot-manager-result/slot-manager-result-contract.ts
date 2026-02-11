/**
 * PURPOSE: Defines the result type for slot manager orchestration
 *
 * USAGE:
 * slotManagerResultContract.parse({completed: true});
 * // Returns validated SlotManagerResult
 */

import { z } from 'zod';
import { dependencyStepContract } from '@dungeonmaster/shared/contracts';

const slotManagerResultCompletedContract = z.object({
  completed: z.literal(true),
});

const slotManagerResultIncompleteContract = z.object({
  completed: z.literal(false),
  incompleteSteps: z.array(dependencyStepContract),
});

export const slotManagerResultContract = z.discriminatedUnion('completed', [
  slotManagerResultCompletedContract,
  slotManagerResultIncompleteContract,
]);

export type SlotManagerResult = z.infer<typeof slotManagerResultContract>;
