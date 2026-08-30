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
 * NO SUB-AGENT COMMITS, so a pass reaches its reviewer entirely uncommitted and that reviewer
 * commits ONCE at the end. `working-tree` is the only scope that sees an uncommitted pass, and
 * alone among them it unions in untracked files — which a fresh pass is mostly made of. Under
 * `unpushed` a reviewer would enumerate `@{upstream}..HEAD`, which at that moment holds nothing
 * from the pass it is grading: a checklist that looks green with not a line of the new code in it.
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
        "Which diff to enumerate. 'working-tree' measures ONE ROUND — everything changed since HEAD and NOT YET COMMITTED, INCLUDING untracked files — and is the reviewer's scope: no sub-agent commits anything, so a pass reaches its reviewer entirely uncommitted and the reviewer commits once at the end. Enumerate before that commit, or this scope is empty. 'unpushed' measures what is committed in this worktree and not yet pushed (@{upstream}..HEAD); before a reviewer commits, that holds nothing from the pass it is grading. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's landed output, for a caller auditing history. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched, and is what a post-push re-review passes.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
