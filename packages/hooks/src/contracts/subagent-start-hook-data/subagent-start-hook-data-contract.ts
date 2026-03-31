/**
 * PURPOSE: Zod schema for SubagentStart hook event data with agent identification fields
 *
 * USAGE:
 * const data = subagentStartHookDataContract.parse({ session_id: 'abc', transcript_path: '/path', cwd: '/cwd', hook_event_name: 'SubagentStart', agent_id: 'agent-123', agent_type: 'Explore' });
 * // Returns validated SubagentStartHookData
 */
import { z } from 'zod';

export const subagentStartHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('SubagentStart'),
  agent_id: z.string().min(1).brand<'AgentId'>(),
  agent_type: z.string().min(1).brand<'AgentType'>(),
});

export type SubagentStartHookData = z.infer<typeof subagentStartHookDataContract>;
