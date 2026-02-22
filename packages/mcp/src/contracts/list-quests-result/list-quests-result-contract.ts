/**
 * PURPOSE: Defines the output schema for the MCP list-quests tool result
 *
 * USAGE:
 * const result: ListQuestsResult = listQuestsResultContract.parse({ success: true, quests: [...] });
 * // Returns validated ListQuestsResult with success status and quests array or error
 */
import { z } from 'zod';

import { questListItemContract } from '@dungeonmaster/shared/contracts';

export const listQuestsResultContract = z
  .object({
    success: z.boolean(),
    quests: z.array(questListItemContract).optional(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'ListQuestsResult'>();

export type ListQuestsResult = z.infer<typeof listQuestsResultContract>;
