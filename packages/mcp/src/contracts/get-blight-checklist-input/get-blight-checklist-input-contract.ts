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
      .enum(['quest', 'commit', 'working-tree', 'unpushed'])
      .describe(
        "Which diff to enumerate. 'unpushed' measures ONE ROUND — everything committed in this worktree and not yet pushed — and is the reviewer-minion's scope: worker-minions commit their own pieces, so a working-tree reading finds nothing, and a commit reading sees only the last of the round's several commits. The operator pushes once at the end of each round, which is what makes unpushed mean this round. 'working-tree' measures everything changed since HEAD that is NOT YET COMMITTED, INCLUDING untracked files, for a caller whose subject really is uncommitted. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's landed output, for a caller auditing history. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
