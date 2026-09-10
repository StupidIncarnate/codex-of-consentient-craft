/**
 * PURPOSE: One row per Claude session that ran on a quest, recording the cwd it ran in. Reach for
 * this over `workItemContract.sessionId` whenever the question is WHERE a session's transcript
 * lives: Claude CLI encodes its JSONL directory from the session's own cwd, and a quest's cwd
 * MOVES when riftcarver carves — so the intake conversation and every post-carve role sit in
 * different directories and no single per-quest answer reaches both.
 *
 * USAGE:
 * questSessionContract.parse({
 *   sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
 *   cwd: '/repo/worktrees/my-quest',
 *   role: 'codeweaver',
 *   startedAt: '2024-01-15T10:00:00.000Z',
 * });
 * // Returns a QuestSession
 *
 * `workItemId` is optional with NO default, and that is the point: a re-plan can REPLACE the work
 * item a finished session belonged to, and the row has to outlive it or the transcript becomes
 * unreachable. A sub-agent never gets a row — it is not a session, it inherits its parent's cwd,
 * and its JSONL sits under that parent's own directory.
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';

export const questSessionContract = z.object({
  sessionId: sessionIdContract,
  cwd: absoluteFilePathContract,
  role: workItemRoleContract,
  workItemId: questWorkItemIdContract.optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type QuestSession = z.infer<typeof questSessionContract>;
