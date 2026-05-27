/**
 * PURPOSE: Initialize MCP server and register tools for architecture discovery and file finding
 *
 * USAGE:
 * await StartMcpServer();
 * // Starts MCP server listening on stdio with all tools registered, and announces the
 * // parent Claude Code session to <DUNGEONMASTER_HOME>/active-monitor-session.json when
 * // CLAUDE_CODE_SESSION_ID is set. The HTTP server reactor reads that file to start the
 * // JSONL watcher against the parent session.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { ArchitectureFlow } from '../flows/architecture/architecture-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { InteractionFlow } from '../flows/interaction/interaction-flow';
import { McpServerFlow } from '../flows/mcp-server/mcp-server-flow';
import { MonitorSessionAnnounceFlow } from '../flows/monitor-session-announce/monitor-session-announce-flow';

export const StartMcpServer = async (): Promise<AdapterResult> => {
  await MonitorSessionAnnounceFlow();

  return McpServerFlow({
    registrations: [...ArchitectureFlow(), ...QuestFlow(), ...InteractionFlow()],
  });
};
