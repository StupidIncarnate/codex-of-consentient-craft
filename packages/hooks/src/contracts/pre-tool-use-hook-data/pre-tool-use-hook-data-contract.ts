import { z } from 'zod';
import { toolInputContract } from '../tool-input/tool-input-contract';

export const preToolUseHookDataContract = z.object({
  session_id: z.string().min(1).brand<'SessionId'>(),
  transcript_path: z.string().min(1).brand<'TranscriptPath'>(),
  cwd: z.string().min(1).brand<'Cwd'>(),
  hook_event_name: z.literal('PreToolUse'),
  tool_name: z.string().min(1).brand<'ToolName'>(),
  tool_input: toolInputContract,
});

export type PreToolUseHookData = z.infer<typeof preToolUseHookDataContract>;
