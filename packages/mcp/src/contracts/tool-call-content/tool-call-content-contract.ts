/**
 * PURPOSE: Defines the schema for MCP tool call content with type and text
 *
 * USAGE:
 * const content: ToolCallContent = toolCallContentContract.parse({ type: 'text', text: 'Result...' });
 * // Returns validated tool call content with type and text fields
 */
import { z } from 'zod';

export const toolCallContentContract = z.object({
  type: z.string().brand<'ContentType'>(),
  text: z.string().brand<'ContentText'>(),
});

export type ToolCallContent = z.infer<typeof toolCallContentContract>;
