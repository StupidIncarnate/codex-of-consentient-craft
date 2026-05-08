/**
 * PURPOSE: Defines timeout constants for MCP server operations
 *
 * USAGE:
 * const timeout = mcpServerStatics.timeouts.requestMs; // 10000
 * // Returns MCP server timeout configuration constants
 */
export const mcpServerStatics = {
  timeouts: {
    requestMs: 10000,
    readinessDeadlineMs: 30000,
    readinessProbeAttemptMs: 1500,
    readinessProbeIntervalMs: 200,
  },
} as const;
