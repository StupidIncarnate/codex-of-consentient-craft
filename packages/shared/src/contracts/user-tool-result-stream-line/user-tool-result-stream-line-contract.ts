/**
 * PURPOSE: Validates the shape of a JSONL stream line where a user message carries tool_result content items
 *
 * USAGE:
 * const parsed = userToolResultStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates user messages containing tool results (permission errors, successful outputs, etc.)
 */
import { z } from 'zod';

export const userToolResultStreamLineContract = z.object({
  type: z.literal('user'),
  message: z.object({
    role: z.literal('user'),
    content: z.array(
      z.object({
        type: z.string().brand<'ContentItemType'>(),
        tool_use_id: z.string().brand<'ToolUseId'>().optional(),
        content: z.string().brand<'ToolResultContent'>().optional(),
        text: z.string().brand<'TextContent'>().optional(),
        is_error: z.boolean().optional(),
      }),
    ),
  }),
});

export type UserToolResultStreamLine = z.infer<typeof userToolResultStreamLineContract>;
