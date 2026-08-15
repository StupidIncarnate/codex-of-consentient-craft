/**
 * PURPOSE: Validates input for the get-blight-checklist MCP tool
 *
 * USAGE:
 * getBlightChecklistInputContract.parse({questId: 'add-auth'});
 * // Returns: GetBlightChecklistInput for the quest's whole-diff blight review
 *
 * getBlightChecklistInputContract.parse({questId: 'add-auth', scope: 'commit'});
 * // Returns: GetBlightChecklistInput scoped to the LAST COMMIT alone
 *
 * `scope` is advertised because the schema is `.strict()`, so an unadvertised key is a hard parse
 * rejection rather than a silently ignored argument. Blightscout's whole surface is ONE COMMIT: its
 * prompt tells it to pass `scope: 'commit'` on every call, and the signal-back completion gate
 * measures its remainder with the same scope and names that exact call back to it on a refusal. A
 * schema that did not carry the field refused every one of those calls, leaving the role no way to
 * read the set it is graded on.
 */

import { z } from 'zod';

export const getBlightChecklistInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to enumerate the blight review surface for')
      .brand<'QuestId'>(),
    scope: z
      .enum(['quest', 'commit'])
      .describe(
        "Which diff to enumerate. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's output, which is what a Blightscout item is dispatched against and what its signal-back completion gate recomputes. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
