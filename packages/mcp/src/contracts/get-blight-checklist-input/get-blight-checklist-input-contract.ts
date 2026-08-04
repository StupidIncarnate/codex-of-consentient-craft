/**
 * PURPOSE: Validates input for the get-blight-checklist MCP tool
 *
 * USAGE:
 * getBlightChecklistInputContract.parse({questId: 'add-auth'});
 * // Returns: GetBlightChecklistInput for the quest's whole-diff blight review
 */

import { z } from 'zod';

export const getBlightChecklistInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to enumerate the blight review surface for')
      .brand<'QuestId'>(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
