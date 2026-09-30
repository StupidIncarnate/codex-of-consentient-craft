/**
 * PURPOSE: Defines the output schema for the quest add operation result
 *
 * USAGE:
 * const result: AddQuestResult = addQuestResultContract.parse({ success: true, questId: 'add-auth', questFolder: '001-add-auth', filePath: '/path/to/quest.json' });
 * // Returns validated AddQuestResult with success status and optional quest details or error
 */
import { z } from '#gateway/npm/zod';

import { questContract } from '../quest/quest-contract';
import { workItemContract } from '../work-item/work-item-contract';

export const addQuestResultContract = z
  .object({
    success: z.boolean(),
    questId: questContract.shape.id.optional(),
    questFolder: z.string().brand<'QuestFolder'>().optional(),
    filePath: z.string().brand<'AddQuestResultFilePath'>().optional(),
    intakeWorkItemId: workItemContract.shape.id.optional(),
    error: z.string().brand<'AddQuestResultError'>().optional(),
  })
  .brand<'AddQuestResult'>();

export type AddQuestResult = z.infer<typeof addQuestResultContract>;
