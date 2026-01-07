/**
 * PURPOSE: Defines the output schema for the quest-get-broker result
 *
 * USAGE:
 * const result: GetQuestResult = getQuestResultContract.parse({ success: true, quest: {...} });
 * // Returns validated GetQuestResult with success status and quest or error
 */
import { z } from 'zod';

import { questContract } from '@dungeonmaster/shared/contracts';

export const getQuestResultContract = z
  .object({
    success: z.boolean(),
    quest: questContract.optional(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'GetQuestResult'>();

export type GetQuestResult = z.infer<typeof getQuestResultContract>;
