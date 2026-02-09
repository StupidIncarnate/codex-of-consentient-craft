/**
 * PURPOSE: Defines the output schema for the verify-quest tool result with individual check results
 *
 * USAGE:
 * const result: VerifyQuestResult = verifyQuestResultContract.parse({ success: true, checks: [...] });
 * // Returns validated VerifyQuestResult with success status and checks array
 */
import { verifyQuestCheckContract } from '@dungeonmaster/orchestrator';
import { z } from 'zod';

export const verifyQuestResultContract = z
  .object({
    success: z.boolean(),
    checks: z.array(verifyQuestCheckContract),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'VerifyQuestResult'>();

export type VerifyQuestResult = z.infer<typeof verifyQuestResultContract>;
