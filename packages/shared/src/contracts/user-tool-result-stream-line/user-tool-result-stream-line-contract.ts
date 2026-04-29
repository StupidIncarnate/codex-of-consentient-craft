/**
 * PURPOSE: Validates the shape of a JSONL stream line where a user message carries tool_result content items
 *
 * USAGE:
 * const parsed = userToolResultStreamLineContract.parse(JSON.parse(rawLine));
 * // Validates user messages containing tool results (permission errors, successful outputs, etc.)
 */
import { z } from 'zod';

import { toolResultBlockParamContract } from '../tool-result-block-param/tool-result-block-param-contract';
import { textBlockParamContract } from '../text-block-param/text-block-param-contract';

export const userToolResultStreamLineContract = z.object({
  type: z.literal('user'),
  message: z.object({
    role: z.literal('user'),
    content: z.array(
      z.discriminatedUnion('type', [toolResultBlockParamContract, textBlockParamContract]),
    ),
  }),
  // Claude CLI emits `toolUseResult` in three distinct shapes:
  //   • Object form for Task / sub-agent completion lines: `{ agentId, status, ... }` —
  //     carries the real internal sub-agent id we read for chain correlation.
  //   • Array form for MCP tools and Bash text returns: `[{ type: 'text', text: '...' }]` —
  //     a verbatim echo of the tool's content, no fields we read.
  //   • String form for tool-error returns (e.g., Read of an oversized file emits
  //     `"Error: File content (N tokens) exceeds maximum allowed tokens (25000)..."`,
  //     or hook-blocked Grep emits an `"Error: PreToolUse:Grep hook error..."` payload).
  // All three shapes must be admitted; readers that access `.agentId` must narrow to the
  // object branch first — string and array values do not carry the field.
  toolUseResult: z
    .union([
      z.object({ agentId: z.string().brand<'AgentIdCorrelation'>().optional() }).passthrough(),
      z.array(z.unknown()),
      z.string().brand<'ToolUseResultErrorMessage'>(),
    ])
    .optional(),
});

export type UserToolResultStreamLine = z.infer<typeof userToolResultStreamLineContract>;
