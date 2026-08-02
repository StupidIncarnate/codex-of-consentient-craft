/**
 * PURPOSE: Validates input for the get-qa-checklist MCP tool
 *
 * USAGE:
 * getQaChecklistInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQaChecklistInput for every flow on the quest
 *
 * getQaChecklistInputContract.parse({questId: 'add-auth', flowId: 'login-flow'});
 * // Returns: GetQaChecklistInput scoped to one flow
 */

import { z } from 'zod';

export const getQaChecklistInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to enumerate the QA surface for')
      .brand<'QuestId'>(),
    flowId: z
      .string()
      .min(1)
      .describe(
        'Optional flow id. Omit to enumerate every flow on the quest; pass one to scope the checklist to the flow this session owns.',
      )
      .brand<'FlowId'>()
      .optional(),
  })
  .strict()
  .brand<'GetQaChecklistInput'>();

export type GetQaChecklistInput = z.infer<typeof getQaChecklistInputContract>;
