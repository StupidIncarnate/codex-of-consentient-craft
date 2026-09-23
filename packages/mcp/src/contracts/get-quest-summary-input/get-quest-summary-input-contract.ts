/**
 * PURPOSE: Validates input for the get-quest-summary MCP tool
 *
 * USAGE:
 * getQuestSummaryInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQuestSummaryInput for the quest's whole verification state
 *
 * `questId` is the ONLY field. The summary is deliberately whole-quest: its value is that a reader
 * sees coverage, mid-quest scope drift, every unit carrying debt and the side-channel notes in
 * ONE read. A `flowId` or `track` narrowing would let a caller ask for the slice it already
 * believes in and miss the hole it did not know about, which is the failure the tool exists to
 * remove — `get-quest-work` is the narrowable per-item surface.
 */

import { z } from 'zod';

export const getQuestSummaryInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to summarize the verification state of')
      .brand<'QuestId'>(),
  })
  .strict()
  .brand<'GetQuestSummaryInput'>();

export type GetQuestSummaryInput = z.infer<typeof getQuestSummaryInputContract>;
