/**
 * PURPOSE: Zod schema for PostToolUse hook event data
 *
 * USAGE:
 * const hookData = postToolUseHookDataContract.parse(data);
 * // Returns validated PostToolUseHookData with tool_name, tool_input, optional tool_response.
 * // tool_input is kept as unknown so any tool's input shape passes — downstream code parses
 * // the specific shape it needs (e.g. askUserQuestionContract, toolInputContract).
 */
import { z } from '#gateway/npm/zod';
import { toolResponseContract } from '../tool-response/tool-response-contract';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const postToolUseHookDataContract = z
  .object({
    session_id: sessionContract.shape.id,
    transcript_path: z.string().min(1).brand<'PostToolUseHookDataTranscriptPath'>(),
    cwd: z.string().min(1).brand<'PostToolUseHookDataCwd'>(),
    hook_event_name: z.literal('PostToolUse'),
    tool_name: z.string().min(1).brand<'PostToolUseHookDataToolName'>(),
    tool_input: z.json(),
    tool_response: toolResponseContract.optional(),
  })
  .brand<'PostToolUseHookData'>();

export type PostToolUseHookData = z.infer<typeof postToolUseHookDataContract>;
