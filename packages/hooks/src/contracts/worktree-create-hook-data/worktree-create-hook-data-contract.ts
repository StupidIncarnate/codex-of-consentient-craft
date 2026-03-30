/**
 * PURPOSE: Zod schema for WorktreeCreate hook event data from Claude Code
 *
 * USAGE:
 * const data = worktreeCreateHookDataContract.parse({ session_id: 'abc', cwd: '/repo', name: 'my-worktree', ... });
 * // Returns validated WorktreeCreateHookData
 */
import { z } from 'zod';

export const worktreeCreateHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('WorktreeCreate'),
  name: z.string().min(1).brand<'WorktreeName'>(),
});

export type WorktreeCreateHookData = z.infer<typeof worktreeCreateHookDataContract>;
