/**
 * PURPOSE: Defines the output schema for the quest-modify-broker result
 *
 * USAGE:
 * const result: ModifyQuestResult = modifyQuestResultContract.parse({ success: true });
 * // Returns validated ModifyQuestResult with success status, optional error, and optional failedChecks
 */
import { z } from 'zod';

const verifyQuestCheckContract = z.object({
  name: z.string().min(1).brand<'CheckName'>(),
  passed: z.boolean(),
  details: z.string().brand<'CheckDetails'>(),
});

export const modifyQuestResultContract = z
  .object({
    success: z.boolean(),
    error: z.string().brand<'ErrorMessage'>().optional(),
    failedChecks: z.array(verifyQuestCheckContract).optional(),
  })
  .brand<'ModifyQuestResult'>();

export type ModifyQuestResult = z.infer<typeof modifyQuestResultContract>;
