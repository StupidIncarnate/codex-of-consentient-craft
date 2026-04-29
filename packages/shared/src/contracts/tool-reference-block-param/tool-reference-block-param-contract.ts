/**
 * PURPOSE: Defines the Anthropic SDK ToolReferenceBlockParam shape for tool name references in content
 *
 * USAGE:
 * toolReferenceBlockParamContract.parse({ type: 'tool_reference', tool_name: 'mcp__dungeonmaster__get-quest' });
 * // Returns: ToolReferenceBlockParam with branded tool_name
 */

import { z } from 'zod';

export const toolReferenceBlockParamContract = z.object({
  type: z.literal('tool_reference'),
  tool_name: z.string().brand<'ToolName'>(),
});

export type ToolReferenceBlockParam = z.infer<typeof toolReferenceBlockParamContract>;
