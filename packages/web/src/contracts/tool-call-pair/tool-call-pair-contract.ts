/**
 * PURPOSE: Defines a paired tool call entry linking a tool_use with its corresponding tool_result
 *
 * USAGE:
 * toolCallPairContract.parse({toolUse: toolUseEntry, toolResult: toolResultEntry});
 * // Returns validated ToolCallPair with linked tool_use and tool_result
 */

import { z } from 'zod';

import { chatEntryContract } from '@dungeonmaster/shared/contracts';

export const toolCallPairContract = z.object({
  toolUse: chatEntryContract.nullable(),
  toolResult: chatEntryContract.nullable(),
});

export type ToolCallPair = z.infer<typeof toolCallPairContract>;
