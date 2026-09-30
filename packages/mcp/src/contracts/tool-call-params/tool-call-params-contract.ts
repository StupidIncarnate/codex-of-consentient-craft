/**
 * PURPOSE: The `{ args, meta }` pair a tool handler receives, after the caller context the
 *   pre-MCP-caller hook stamped onto the arguments has been moved into `meta`.
 *
 * USAGE:
 * toolCallParamsContract.parse({ args: { glob: 'x' }, meta: { 'claudecode/toolUseId': 'toolu_1' } });
 * // Returns ToolCallParams
 */
import { z } from '#gateway/npm/zod';

export const toolCallParamsContract = z
  .object({
    args: z.record(z.string(), z.json()),
    meta: z.record(z.string(), z.json()).optional(),
  })
  .brand<'ToolCallParams'>();

export type ToolCallParams = z.infer<typeof toolCallParamsContract>;
