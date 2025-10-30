/**
 * PURPOSE: Defines timeout constants for MCP server operations
 *
 * USAGE:
 * const timeout = mcpServerStatics.timeouts.requestMs; // 5000
 * // Returns MCP server timeout configuration constants
 */
export const mcpServerStatics = {
  timeouts: {
    startupMs: 500,
    requestMs: 5000,
  },
} as const;
