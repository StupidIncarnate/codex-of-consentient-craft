/**
 * PURPOSE: Zod schema for PreToolUse hook event data targeting search tools (Grep, Glob)
 *
 * USAGE:
 * const hookData = preSearchHookDataContract.parse(data);
 * // Returns validated PreSearchHookData with tool_name and passthrough tool_input
 */
import { z } from 'zod';

export const preSearchHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('PreToolUse'),
  tool_name: z.string().min(1).brand<'ToolName'>(),
  tool_input: z.unknown(),
});

export type PreSearchHookData = z.infer<typeof preSearchHookDataContract>;
