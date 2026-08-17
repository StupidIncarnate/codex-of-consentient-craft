/**
 * PURPOSE: Validates input for the get-quest-planning-notes MCP tool
 *
 * USAGE:
 * getQuestPlanningNotesInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQuestPlanningNotesInput branded object
 */

import { z } from 'zod';

export const getQuestPlanningNotesInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to load planning notes for')
      .brand<'QuestId'>(),
  })
  .strict()
  .brand<'GetQuestPlanningNotesInput'>();

export type GetQuestPlanningNotesInput = z.infer<typeof getQuestPlanningNotesInputContract>;
