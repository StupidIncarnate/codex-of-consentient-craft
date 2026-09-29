/**
 * PURPOSE: Initialize MCP server and register tools for architecture discovery and file finding
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts the MCP server listening on stdio with all tools registered. It starts none of the
 * // orchestrator's passive watchers — every Claude session runs one of these children, and the
 * // watchers (the usage-ledger poller among them) belong to the one HTTP server per home.
 */

import { ArchitectureFlow } from '../flows/architecture/architecture-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { InteractionFlow } from '../flows/interaction/interaction-flow';
import { McpServerFlow } from '../flows/mcp-server/mcp-server-flow';

export const StartMcpServer = async (): Promise<void> =>
  McpServerFlow({
    registrations: [...ArchitectureFlow(), ...QuestFlow(), ...InteractionFlow()],
  });
