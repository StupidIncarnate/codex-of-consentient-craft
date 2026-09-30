/**
 * PURPOSE: Validates input for the get-quest-planning-notes MCP tool
 *
 * USAGE:
 * getQuestPlanningNotesInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQuestPlanningNotesInput branded object
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const getQuestPlanningNotesInputContract = z
  .object({
    questId: questContract.shape.id,
  })
  .strict()
  .brand<'GetQuestPlanningNotesInput'>();

export type GetQuestPlanningNotesInput = z.infer<typeof getQuestPlanningNotesInputContract>;
