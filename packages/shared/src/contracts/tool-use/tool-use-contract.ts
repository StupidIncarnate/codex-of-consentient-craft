/**
 * PURPOSE: Defines a tool invocation emitted by the assistant. Owns the tool use id: every field
 * that holds one reuses `toolUseContract.shape.id`
 *
 * USAGE:
 * toolUseContract.parse({ type: 'tool_use', id: 'toolu_01...', name: 'Bash', input: { command: 'ls' } });
 * // Returns: ToolUse with branded id and name fields
 */

import { z } from '#gateway/npm/zod';

export const toolUseContract = z
  .object({
    type: z.literal('tool_use'),
    id: z.string().min(1).brand<'ToolUseId'>(),
    name: z.string().brand<'ToolUseName'>(),
    input: z.json(),
  })
  .brand<'ToolUse'>();

export type ToolUse = z.infer<typeof toolUseContract>;
