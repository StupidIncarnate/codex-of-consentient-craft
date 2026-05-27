/**
 * PURPOSE: Names of MCP tools that the /dumpster-launch dispatcher calls in the parent session for pure orchestration control (not content). These are filtered out of WS chat-output broadcasts to keep dispatcher chatter out of the web UI's chat panel. Any other mcp__* tool (create-quest, modify-quest, ask-user-question, etc.) is treated as spec-conversation content and passes through.
 *
 * USAGE:
 * dispatcherMcpToolsStatics.names.includes('mcp__dungeonmaster__get-next-step');
 * // Returns true for dispatcher tools, false for content tools
 */

export const dispatcherMcpToolsStatics = {
  names: [
    'mcp__dungeonmaster__get-next-step',
    'mcp__dungeonmaster__run-ward',
    'mcp__dungeonmaster__signal-back',
    'mcp__dungeonmaster__register-monitor-session',
  ] as const,
} as const;
