/**
 * PURPOSE: Defines the response schema returned by tool handlers during MCP tool execution
 *
 * USAGE:
 * const response: ToolResponse = toolResponseContract.parse({ content: [{ type: 'text', text: 'Result' }] });
 * // Returns validated tool response with content array and optional error flag
 */
import { z } from 'zod';

export const toolResponseContract = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string().brand<'ContentText'>(),
    }),
  ),
  isError: z.boolean().optional(),
});

export type ToolResponse = z.infer<typeof toolResponseContract>;
