/**
 * PURPOSE: Builds the `updatedInput` the pre-MCP-caller hook returns: the MCP tool's own input,
 *   unchanged, plus the caller context under `mcpCallerContextStatics.keys.argument`. Every original
 *   key is echoed back because Claude Code REPLACES the tool input with `updatedInput` instead of
 *   merging it, so a key left out here never reaches the tool.
 *
 * USAGE:
 * mcpCallerUpdatedInputTransformer({ hookData });
 * // Returns { ...hookData.tool_input, dungeonmasterCaller: { cwd, sessionId, agentId? } }
 */
import { mcpCallerContextContract } from '@dungeonmaster/shared/contracts';
import { mcpCallerContextStatics } from '@dungeonmaster/shared/statics';

import type { McpPreToolUseHookData } from '../../contracts/mcp-pre-tool-use-hook-data/mcp-pre-tool-use-hook-data-contract';
import {
  mcpToolInputContract,
  type McpToolInput,
} from '../../contracts/mcp-tool-input/mcp-tool-input-contract';

export const mcpCallerUpdatedInputTransformer = ({
  hookData,
}: {
  hookData: McpPreToolUseHookData;
}): McpToolInput =>
  mcpToolInputContract.parse({
    ...hookData.tool_input,
    [mcpCallerContextStatics.keys.argument]: mcpCallerContextContract.parse({
      cwd: hookData.cwd,
      sessionId: hookData.session_id,
      ...(hookData.agent_id !== undefined && { agentId: hookData.agent_id }),
    }),
  });
