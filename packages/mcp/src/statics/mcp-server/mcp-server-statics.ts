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
  resolveScript:
    "try { require('@dungeonmaster/mcp'); } catch (e) { try { const g = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim(); const p = require('path'); try { require(p.join(g, '@dungeonmaster/mcp')); } catch { require(p.join(g, 'dungeonmaster', 'node_modules', '@dungeonmaster/mcp')); } } catch { throw e; } }",
} as const;
