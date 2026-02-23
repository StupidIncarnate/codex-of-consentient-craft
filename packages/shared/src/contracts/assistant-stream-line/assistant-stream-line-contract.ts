/**
 * PURPOSE: Validates the shape of a JSONL stream line where an assistant message carries content items
 * (text, tool_use, tool_result, thinking)
 *
 * USAGE:
 * const parsed = assistantStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates assistant messages from Claude CLI streaming output
 */
import { z } from 'zod';

const contentItemContract = z.object({
  type: z.string().brand<'ContentItemType'>(),
  text: z.string().brand<'TextContent'>().optional(),
  thinking: z.string().brand<'ThinkingContent'>().optional(),
  id: z.string().brand<'ToolUseId'>().optional(),
  name: z.string().brand<'ToolName'>().optional(),
  input: z.record(z.unknown()).optional(),
  tool_use_id: z.string().brand<'ToolUseId'>().optional(),
  content: z.union([z.string().brand<'ToolResultContent'>(), z.array(z.unknown())]).optional(),
  is_error: z.boolean().optional(),
});

export const assistantStreamLineContract = z.object({
  type: z.literal('assistant'),
  message: z.object({
    role: z.literal('assistant'),
    content: z.array(contentItemContract),
    usage: z
      .object({
        input_tokens: z.number().brand<'InputTokenCount'>(),
        output_tokens: z.number().brand<'OutputTokenCount'>(),
      })
      .optional(),
    stop_reason: z.string().brand<'StopReason'>().optional(),
    model: z.string().brand<'ModelName'>().optional(),
  }),
});

export type AssistantStreamLine = z.infer<typeof assistantStreamLineContract>;
