/**
 * PURPOSE: Defines the output schema for the quest-modify-broker result
 *
 * USAGE:
 * const result: ModifyQuestResult = modifyQuestResultContract.parse({ success: true });
 * // Returns validated ModifyQuestResult with success status and optional error
 */
import { z } from 'zod';

export const modifyQuestResultContract = z
  .object({
    success: z.boolean(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'ModifyQuestResult'>();

export type ModifyQuestResult = z.infer<typeof modifyQuestResultContract>;
