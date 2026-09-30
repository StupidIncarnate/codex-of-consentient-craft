/**
 * PURPOSE: Zod schema for PreToolUse hook event data
 *
 * USAGE:
 * const hookData = preToolUseHookDataContract.parse(data);
 * // Returns validated PreToolUseHookData with tool_name and tool_input
 */
import { z } from '#gateway/npm/zod';
import { toolInputContract } from '../tool-input/tool-input-contract';
import { sessionContract } from '@dungeonmaster/shared/contracts';

export const preToolUseHookDataContract = z
  .object({
    session_id: sessionContract.shape.id,
    transcript_path: z.string().min(1).brand<'PreToolUseHookDataTranscriptPath'>(),
    cwd: z.string().min(1).brand<'PreToolUseHookDataCwd'>(),
    hook_event_name: z.literal('PreToolUse'),
    tool_name: z.string().min(1).brand<'PreToolUseHookDataToolName'>(),
    tool_input: toolInputContract,
  })
  .brand<'PreToolUseHookData'>();

export type PreToolUseHookData = z.infer<typeof preToolUseHookDataContract>;
