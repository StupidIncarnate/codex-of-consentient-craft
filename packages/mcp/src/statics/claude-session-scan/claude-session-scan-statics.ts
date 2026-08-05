/**
 * PURPOSE: Retry budget for the JSONL scan that maps an MCP call's toolUseId back to the Claude
 * Code session that made it.
 *
 * USAGE:
 * claudeSessionScanStatics.maxAttempts;
 * // Returns the number of scan passes before the resolver gives up.
 *
 * Claude Code dispatches an MCP call BEFORE flushing the originating `tool_use` line to disk
 * (empirically a ~50–200ms gap), so a first-pass miss is expected rather than exceptional. The
 * default 30 × 100ms = 3s ceiling absorbs worst-case flush latency under load while staying well
 * under any MCP request timeout; the common case returns on the first pass, so the budget is the
 * ceiling, not the cost.
 */

export const claudeSessionScanStatics = {
  maxAttempts: 30,
  retryDelayMs: 100,
} as const;
