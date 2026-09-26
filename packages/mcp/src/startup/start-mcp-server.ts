/**
 * PURPOSE: Initialize MCP server and register tools for architecture discovery and file finding
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts the orchestrator's passive watchers, then the MCP server listening on stdio with all
 * // tools registered. The HTTP server reactor discovers which parent Claude Code session to tail
 * // when the first sub-agent calls `get-agent-prompt` with `_meta.claudecode/toolUseId` — see
 * // ResolveSubagentIdentityLayerResponder.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { ArchitectureFlow } from '../flows/architecture/architecture-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { InteractionFlow } from '../flows/interaction/interaction-flow';
import { McpServerFlow } from '../flows/mcp-server/mcp-server-flow';
import { OrchestrationBootFlow } from '../flows/orchestration-boot/orchestration-boot-flow';

export const StartMcpServer = async (): Promise<AdapterResult> => {
  OrchestrationBootFlow.bootstrap();

  return McpServerFlow({
    registrations: [...ArchitectureFlow(), ...QuestFlow(), ...InteractionFlow()],
  });
};
