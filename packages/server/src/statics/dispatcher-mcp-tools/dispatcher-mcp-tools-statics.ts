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
    // Both COMMAND roles belong here for the same reason: the dispatcher runs them itself, in the
    // parent session, so their tool-call line is orchestration control rather than anything a
    // reader wants in the chat panel. Their OUTPUT still reaches the panel — it arrives as
    // chat-output keyed on the work item, which is a different path from this filter.
    'mcp__dungeonmaster__run-ward',
    'mcp__dungeonmaster__run-riftcarver',
    'mcp__dungeonmaster__signal-back',
  ] as const,
} as const;
