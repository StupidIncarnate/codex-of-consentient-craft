/**
 * PURPOSE: Defines timeout constants for MCP server operations
 *
 * USAGE:
 * const timeout = mcpServerStatics.timeouts.requestMs; // 10000
 * // Returns MCP server timeout configuration constants
 */
export const mcpServerStatics = {
  timeouts: {
    startupMs: 2000,
    requestMs: 10000,
  },
} as const;
