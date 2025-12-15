/**
 * PURPOSE: Defines the output schema for the MCP add-quest tool result
 *
 * USAGE:
 * const result: AddQuestResult = addQuestResultContract.parse({ success: true, questId: 'add-auth', questFolder: '001-add-auth', filePath: '/path/to/quest.json' });
 * // Returns validated AddQuestResult with success status and optional quest details or error
 */
import { z } from 'zod';

export const addQuestResultContract = z
  .object({
    success: z.boolean(),
    questId: z.string().brand<'QuestId'>().optional(),
    questFolder: z.string().brand<'QuestFolder'>().optional(),
    filePath: z.string().brand<'FilePath'>().optional(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'AddQuestResult'>();

export type AddQuestResult = z.infer<typeof addQuestResultContract>;
