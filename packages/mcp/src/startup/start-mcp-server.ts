/**
 * PURPOSE: Initialize MCP server and register tools for architecture discovery and file finding
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts MCP server listening on stdio with all tools registered
 */

import { ArchitectureFlow } from '../flows/architecture/architecture-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { InteractionFlow } from '../flows/interaction/interaction-flow';
import { McpServerFlow } from '../flows/mcp-server/mcp-server-flow';

export const StartMcpServer = async (): Promise<void> => {
  const registrations = [...ArchitectureFlow(), ...QuestFlow(), ...InteractionFlow()];
  await McpServerFlow({ registrations });
};
