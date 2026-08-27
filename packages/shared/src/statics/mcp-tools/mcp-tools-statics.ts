/**
 * PURPOSE: Single source of truth for MCP tool names and server configuration
 *
 * USAGE:
 * mcpToolsStatics.tools.names;
 * // Returns readonly array of all MCP tool names: ['discover', 'get-architecture', ...]
 *
 * mcpToolsStatics.server.name;
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
      'ask-user-question',
      'get-agent-prompt',
      'get-project-map',
      'get-quest-planning-notes',
      'get-qa-checklist',
      'get-blight-checklist',
      'get-project-inventory',
      'create-quest',
      'get-next-step',
      'run-ward',
      'run-riftcarver',
      'get-server-config',
      'reset-flow-signoffs',
      'get-quest-summary',
      'get-planner-information',
      'get-worker-information',
      'get-reviewer-information',
    ] as const,
  },
} as const;
