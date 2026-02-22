/**
 * PURPOSE: Defines the schema for MCP tool call results with content array
 *
 * USAGE:
 * const result: ToolCallResult = toolCallResultContract.parse({ content: [{ type: 'text', text: 'Result...' }] });
 * // Returns validated tool call result with array of content items
 */
import { z } from 'zod';

const toolCallContentContract = z.object({
  type: z.string().brand<'ContentType'>(),
  text: z.string().brand<'ContentText'>(),
});

export const toolCallResultContract = z.object({
  content: z.array(toolCallContentContract),
});

export type ToolCallResult = z.infer<typeof toolCallResultContract>;
