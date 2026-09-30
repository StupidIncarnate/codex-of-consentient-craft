/**
 * PURPOSE: Defines the Anthropic SDK ToolUseBlockParam shape for assistant tool invocations
 *
 * USAGE:
 * toolUseBlockParamContract.parse({ type: 'tool_use', id: 'toolu_01...', name: 'Bash', input: { command: 'ls' } });
 * // Returns: ToolUseBlockParam with branded id and name fields
 */

import { z } from '#gateway/npm/zod';

export const toolUseBlockParamContract = z.object({
  type: z.literal('tool_use'),
  id: z.string().min(1).brand<'ToolUseBlockParamId'>(),
  name: z.string().brand<'ToolUseBlockParamName'>(),
  input: z.unknown(),
}).brand<'ToolUseBlockParam'>();

export type ToolUseBlockParam = z.infer<typeof toolUseBlockParamContract>;
