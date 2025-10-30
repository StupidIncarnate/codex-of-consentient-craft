/**
 * PURPOSE: Zod schema for PostToolUse hook event data
 *
 * USAGE:
 * const hookData = postToolUseHookDataContract.parse(data);
 * // Returns validated PostToolUseHookData with tool_name, tool_input, optional tool_response
 */
import { z } from 'zod';
import { toolInputContract } from '../tool-input/tool-input-contract';
import { toolResponseContract } from '../tool-response/tool-response-contract';

export const postToolUseHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('PostToolUse'),
  tool_name: z.string().min(1).brand<'ToolName'>(),
  tool_input: toolInputContract,
  tool_response: toolResponseContract.optional(),
});

export type PostToolUseHookData = z.infer<typeof postToolUseHookDataContract>;
