/**
 * PURPOSE: Zod schema for WorktreeCreate hook event data from Claude Code
 *
 * USAGE:
 * const data = worktreeCreateHookDataContract.parse({ session_id: 'abc', worktree_path: '/path', branch: 'my-branch', ... });
 * // Returns validated WorktreeCreateHookData
 */
import { z } from 'zod';

export const worktreeCreateHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('WorktreeCreate'),
  worktree_path: z.string().min(1).brand<'WorktreePath'>(),
  branch: z.string().min(1).brand<'BranchName'>(),
  isolation: z.string().brand<'IsolationMode'>(),
});

export type WorktreeCreateHookData = z.infer<typeof worktreeCreateHookDataContract>;
