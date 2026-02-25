/**
 * PURPOSE: Single source of truth for MCP tool names and server configuration
 *
 * USAGE:
 * mcpToolsStatics.toolNames;
 * // Returns readonly array of all MCP tool names: ['discover', 'get-architecture', ...]
 *
 * mcpToolsStatics.serverName;
 * // Returns 'dungeonmaster' - the MCP server name used in permissions
 */

export const mcpToolsStatics = {
  server: {
    name: 'dungeonmaster',
  },
  tools: {
    names: [
      'discover',
      'get-architecture',
      'get-folder-detail',
      'get-syntax-rules',
      'get-testing-patterns',
      'get-quest',
      'modify-quest',
      'signal-back',
      'start-quest',
      'get-quest-status',
      'list-quests',
      'list-guilds',
      'verify-quest',
      'ask-user-question',
    ] as const,
  },
} as const;
