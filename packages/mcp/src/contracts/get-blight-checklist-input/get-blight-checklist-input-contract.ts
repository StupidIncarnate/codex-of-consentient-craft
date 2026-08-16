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
 * getBlightChecklistInputContract.parse({questId: 'add-auth', scope: 'working-tree'});
 * // Returns: GetBlightChecklistInput scoped to everything changed but not yet committed
 *
 * `scope` is advertised because the schema is `.strict()`, so an unadvertised key is a hard parse
 * rejection rather than a silently ignored argument. `working-tree` is the reviewer-minion's
 * surface: it runs INSIDE its parent session's turn, before that session commits, so `commit`
 * would hand it the round BEFORE its own — nothing from the parent's current turn is in history
 * yet. A schema that did not carry the field would refuse every one of those calls, leaving the
 * reviewer no way to read the set its parent's signal-back gate expects a disposition from.
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
      .enum(['quest', 'commit', 'working-tree'])
      .describe(
        "Which diff to enumerate. 'working-tree' measures everything changed since HEAD that is NOT YET COMMITTED, INCLUDING untracked files — the surface for a reviewer-minion that runs INSIDE its parent session's turn, before that session commits, and the scope that session's signal-back review-coverage gate expects a disposition from. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's landed output, for a caller auditing history rather than a working tree. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
