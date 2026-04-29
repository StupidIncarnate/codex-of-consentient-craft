/**
 * PURPOSE: Validates the shape of a JSONL stream line where an assistant message carries content items
 * (text, tool_use, tool_result, thinking, redacted_thinking)
 *
 * USAGE:
 * const parsed = assistantStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates assistant messages from Claude CLI streaming output
 */
import { z } from 'zod';

import { assistantContentBlockParamContract } from '../assistant-content-block-param/assistant-content-block-param-contract';

// `stop_reason` and `model` use `.nullish()` because Claude CLI emits explicit `null`
// for these fields on streamed assistant deltas before a turn completes — `.optional()`
// alone rejects null and silently drops every assistant line.
export const assistantStreamLineContract = z.object({
  type: z.literal('assistant'),
  message: z.object({
    role: z.literal('assistant'),
    content: z.array(assistantContentBlockParamContract),
    usage: z
      .object({
        input_tokens: z.number().brand<'InputTokenCount'>(),
        output_tokens: z.number().brand<'OutputTokenCount'>(),
      })
      .optional(),
    stop_reason: z.string().brand<'StopReason'>().nullish(),
    model: z.string().brand<'ModelName'>().nullish(),
  }),
});

export type AssistantStreamLine = z.infer<typeof assistantStreamLineContract>;
