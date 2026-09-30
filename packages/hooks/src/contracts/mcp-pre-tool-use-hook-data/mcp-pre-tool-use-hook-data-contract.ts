/**
 * PURPOSE: Zod schema for the PreToolUse hook data Claude Code sends before a dungeonmaster MCP call.
 *   Reach for this over preToolUseHookDataContract, whose `tool_input` only admits the Write, Edit
 *   and Bash shapes: an MCP tool's input is whatever that tool declares, and it must pass through
 *   untouched because Claude Code REPLACES the tool input with a hook's `updatedInput`. `agent_id`
 *   is present only when a Task-dispatched sub-agent made the call.
 *
 * USAGE:
 * const hookData = mcpPreToolUseHookDataContract.parse(data);
 * // Returns McpPreToolUseHookData
 */
import { z } from '#gateway/npm/zod';
import { absoluteFilePathContract, agentContract, sessionContract } from '@dungeonmaster/shared/contracts';

import { mcpToolInputContract } from '../mcp-tool-input/mcp-tool-input-contract';

export const mcpPreToolUseHookDataContract = z.object({
  session_id: sessionContract.shape.id,
  cwd: absoluteFilePathContract,
  hook_event_name: z.literal('PreToolUse'),
  tool_name: z.string().min(1).brand<'McpPreToolUseHookDataToolName'>(),
  tool_input: mcpToolInputContract,
  agent_id: agentContract.shape.id.optional(),
});

export type McpPreToolUseHookData = z.infer<typeof mcpPreToolUseHookDataContract>;
