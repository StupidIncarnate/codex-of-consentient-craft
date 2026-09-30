/**
 * PURPOSE: Zod schema for WorktreeCreate hook event data from Claude Code
 *
 * USAGE:
 * const data = worktreeCreateHookDataContract.parse({ session_id: 'abc', cwd: '/repo', name: 'my-worktree', ... });
 * // Returns validated WorktreeCreateHookData
 */
import { z } from '#gateway/npm/zod';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const worktreeCreateHookDataContract = z.object({
  session_id: sessionContract.shape.id,
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('WorktreeCreate'),
  name: z.string().min(1).brand<'WorktreeName'>(),
});

export type WorktreeCreateHookData = z.infer<typeof worktreeCreateHookDataContract>;
