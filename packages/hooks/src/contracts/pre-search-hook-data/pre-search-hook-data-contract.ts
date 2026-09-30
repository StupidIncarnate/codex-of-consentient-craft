/**
 * PURPOSE: Zod schema for PreToolUse hook event data targeting search tools (Grep, Glob)
 *
 * USAGE:
 * const hookData = preSearchHookDataContract.parse(data);
 * // Returns validated PreSearchHookData with tool_name and passthrough tool_input
 */
import { z } from '#gateway/npm/zod';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const preSearchHookDataContract = z.object({
  session_id: sessionContract.shape.id,
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('PreToolUse'),
  tool_name: z.string().min(1).brand<'PreSearchHookDataToolName'>(),
  tool_input: z.unknown(),
}).brand<'PreSearchHookData'>();

export type PreSearchHookData = z.infer<typeof preSearchHookDataContract>;
