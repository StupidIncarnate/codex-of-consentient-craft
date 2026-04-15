/**
 * PURPOSE: Validates input for the get-planning-notes MCP tool
 *
 * USAGE:
 * getPlanningNotesInputContract.parse({questId: 'add-auth'});
 * // Returns: GetPlanningNotesInput branded object
 */

import { z } from 'zod';

export const getPlanningNotesInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to load planning notes for')
      .brand<'QuestId'>(),
  })
  .brand<'GetPlanningNotesInput'>();

export type GetPlanningNotesInput = z.infer<typeof getPlanningNotesInputContract>;
