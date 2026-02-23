/**
 * PURPOSE: Validates the shape of a JSONL stream line where a user message carries plain text content
 *
 * USAGE:
 * const parsed = userTextStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates user messages with string or array text content (no tool results)
 */
import { z } from 'zod';

export const userTextStreamLineContract = z.object({
  type: z.literal('user'),
  message: z.object({
    role: z.literal('user'),
    content: z.union([
      z.string().brand<'UserTextContent'>(),
      z.array(
        z.object({
          type: z.literal('text'),
          text: z.string().brand<'TextContent'>(),
        }),
      ),
    ]),
  }),
});

export type UserTextStreamLine = z.infer<typeof userTextStreamLineContract>;
