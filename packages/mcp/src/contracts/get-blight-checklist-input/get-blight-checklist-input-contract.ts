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
 * // Returns: GetBlightChecklistInput scoped to ONE ROUND — everything uncommitted, untracked included
 *
 * getBlightChecklistInputContract.parse({questId: 'add-auth', scope: 'unpushed'});
 * // Returns: GetBlightChecklistInput scoped to what is committed here and not yet pushed
 *
 * `scope` is advertised because the schema is `.strict()`, so an unadvertised key is a hard parse
 * rejection rather than a silently ignored argument. `working-tree` is the reviewer's surface, and
 * the `.describe()` below is what tells the agent so.
 *
 * NO SESSION ON A PASS COMMITS ITS OWN WORK, so a pass reaches its `review` step entirely
 * uncommitted and stays that way through the reviewer's own turn: the family's deterministic
 * `commit` step lands everything ONCE, right after `review`'s `done` routes there —
 * `stepHandlerCommitBroker`, never the reviewer itself. `working-tree` is the only scope that sees
 * that uncommitted pass, and alone among them it unions in untracked files — which a fresh pass is
 * mostly made of. Under `unpushed` a reviewer would enumerate `@{upstream}..HEAD`, which at that
 * moment (before the deterministic commit has run) holds nothing from the pass it is grading: a
 * checklist that looks green with not a line of the new code in it.
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
        "Which diff to enumerate. 'working-tree' measures ONE ROUND — everything changed since HEAD and NOT YET COMMITTED, INCLUDING untracked files — and is the reviewer's scope: no session on a pass commits its own work, so a pass reaches its `review` step entirely uncommitted and stays that way through the reviewer's own turn — the family's deterministic `commit` step lands it once, right after `review`'s `done`. Enumerate before that deterministic commit runs, or this scope is empty. 'unpushed' measures what is committed in this worktree and not yet pushed (@{upstream}..HEAD); before that deterministic commit runs, that holds nothing from the pass it is grading. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one pass's landed output, for a caller auditing history. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched, and is what a post-push re-review passes.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
