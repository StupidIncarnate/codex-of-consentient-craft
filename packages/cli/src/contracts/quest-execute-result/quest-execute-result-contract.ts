/**
 * PURPOSE: Defines the result structure from executing a quest pipeline
 *
 * USAGE:
 * questExecuteResultContract.parse({success: true});
 * questExecuteResultContract.parse({success: false, reason: 'Ward check failed'});
 * // Returns: QuestExecuteResult indicating pipeline success or failure
 */

import { z } from 'zod';

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

export const questExecuteResultContract = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    reason: errorMessageContract,
  }),
]);

export type QuestExecuteResult = z.infer<typeof questExecuteResultContract>;
