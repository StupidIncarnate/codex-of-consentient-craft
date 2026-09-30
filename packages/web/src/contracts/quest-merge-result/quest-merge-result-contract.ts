/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/merge. `fetchJson` resolves `unknown`; this is what the broker
 * parses its response through.
 *
 * USAGE:
 * questMergeResultContract.parse({ merging: true });
 * // Returns { merging: true }
 */

import { z } from '#gateway/npm/zod';

export const questMergeResultContract = z
  .object({
    merging: z.boolean(),
  })
  .brand<'QuestMergeResult'>();

export type QuestMergeResult = z.infer<typeof questMergeResultContract>;
