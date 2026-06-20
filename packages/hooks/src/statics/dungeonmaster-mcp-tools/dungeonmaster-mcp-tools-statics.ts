/**
 * PURPOSE: Fully-qualified Claude Code tool names for the dungeonmaster MCP tools the SubagentStop hook inspects in a sub-agent transcript
 *
 * USAGE:
 * dungeonmasterMcpToolsStatics.getAgentPromptToolName;
 * // Returns: 'mcp__dungeonmaster__get-agent-prompt' — the tool a work-item agent calls to fetch its prompt
 * dungeonmasterMcpToolsStatics.signalBackToolName;
 * // Returns: 'mcp__dungeonmaster__signal-back' — the terminal signal a work-item agent must call before stopping
 */

export const dungeonmasterMcpToolsStatics = {
  getAgentPromptToolName: 'mcp__dungeonmaster__get-agent-prompt',
  signalBackToolName: 'mcp__dungeonmaster__signal-back',
} as const;
