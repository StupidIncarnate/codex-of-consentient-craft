/**
 * PURPOSE: Zod schema for SubagentStop hook event data — the JSON Claude Code delivers on stdin when a Task-dispatched sub-agent finishes its turn
 *
 * USAGE:
 * const data = subagentStopHookDataContract.parse({ session_id: 'abc', transcript_path: '/parent.jsonl', agent_transcript_path: '/sub.jsonl', cwd: '/cwd', hook_event_name: 'SubagentStop' });
 * // Returns validated SubagentStopHookData. NOTE: `transcript_path` is the PARENT session transcript;
 * //   the stopping sub-agent's OWN transcript is `agent_transcript_path` — read that one.
 */
import { z } from 'zod';

export const subagentStopHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  agent_transcript_path: z.string().min(1).brand<'TranscriptPath'>().optional(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('SubagentStop'),
  stop_hook_active: z.boolean().optional(),
});

export type SubagentStopHookData = z.infer<typeof subagentStopHookDataContract>;
