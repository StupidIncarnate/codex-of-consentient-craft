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
 * rejection rather than a silently ignored argument. `working-tree` is the reviewer-minion's surface,
 * and the `.describe()` below is what tells the agent so.
 *
 * THAT WAS `unpushed` UNTIL WORKERS STOPPED COMMITTING, and the describe text outlived the premise.
 * When each worker-minion committed its own chunk, a reviewer met a round already in history and
 * `working-tree` genuinely found nothing. Workers commit nothing now — `workerInformationStatics`
 * says "Leave your work in the tree and your REVIEWER commits the whole round" — so a round reaches
 * its reviewer entirely uncommitted, and the reviewer commits ONCE at the end. Under `unpushed` that
 * reviewer enumerated `@{upstream}..HEAD`, which at that moment holds the PLANNER's commit of the
 * round document and nothing else: a checklist over one markdown file, looking green, with not a
 * line of the round's code in it. `working-tree` is the only scope that sees an uncommitted round,
 * and alone among them it unions in untracked files — which a fresh round is mostly made of.
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
        "Which diff to enumerate. 'working-tree' measures ONE ROUND — everything changed since HEAD and NOT YET COMMITTED, INCLUDING untracked files — and is the reviewer-minion's scope: no worker commits anything, so a round reaches its reviewer entirely uncommitted and the reviewer commits once at the end. Enumerate before that commit, or this scope is empty. 'unpushed' measures what is committed in this worktree and not yet pushed (@{upstream}..HEAD); before a reviewer commits, that is the planner's round-document commit and nothing else. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's landed output, for a caller auditing history. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched, and is what a post-push re-review passes.",
      )
      .optional(),
  })
  .strict()
  .brand<'GetBlightChecklistInput'>();

export type GetBlightChecklistInput = z.infer<typeof getBlightChecklistInputContract>;
