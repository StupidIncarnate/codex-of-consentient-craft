/**
 * PURPOSE: Handles the PreToolUse hook for dungeonmaster MCP calls by stamping who is calling onto
 *   the call's arguments, so the MCP server reads its caller's directory, session and sub-agent id
 *   straight from the call instead of scanning transcripts for a line not yet written.
 *
 * USAGE:
 * const updatedInput = HookPreMcpCallerResponder({ input: hookData });
 * // Returns the tool input plus the caller context, or null when the hook data is not a PreToolUse
 * // event it can read — the call then goes ahead unchanged and the server falls back
 */
import { mcpPreToolUseHookDataContract } from '../../../contracts/mcp-pre-tool-use-hook-data/mcp-pre-tool-use-hook-data-contract';
import type { McpToolInput } from '../../../contracts/mcp-tool-input/mcp-tool-input-contract';
import { mcpCallerUpdatedInputTransformer } from '../../../transformers/mcp-caller-updated-input/mcp-caller-updated-input-transformer';

export const HookPreMcpCallerResponder = ({ input }: { input: unknown }): McpToolInput | null => {
  const parsed = mcpPreToolUseHookDataContract.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return mcpCallerUpdatedInputTransformer({ hookData: parsed.data });
};
