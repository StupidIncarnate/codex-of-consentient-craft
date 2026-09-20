/**
 * PURPOSE: Bounds callerCwdScanCursorState so a long-running MCP server on a machine with
 * hundreds of Claude Code sessions never grows the cursor cache without limit.
 *
 * USAGE:
 * callerCwdScanCursorStatics.limits.maxEntries;
 * // Returns the cursor count above which the least-recently-used entry is evicted
 */

export const callerCwdScanCursorStatics = {
  limits: {
    // A session realistically alternates between its own top-level file and a handful of
    // concurrently live sub-agent files — 8 covers that with room to spare without holding
    // cursors for sessions this server hasn't heard from in a while.
    maxEntries: 8,
  },
} as const;
