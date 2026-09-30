/**
 * PURPOSE: Bounds for the mock Claude CLI queue response fields
 *
 * USAGE:
 * claudeQueueResponseStatics.exitCode.max
 * // Returns: 255 — the largest process exit code a POSIX shell reports
 */

export const claudeQueueResponseStatics = {
  exitCode: {
    max: 255,
  },
} as const;
