/**
 * PURPOSE: Throttle window for rate-limits snapshot writes by the statusline-tap CLI subcommand
 *
 * USAGE:
 * rateLimitsThrottleStatics.minIntervalMs
 * // Returns: 5000 — minimum milliseconds between accepted snapshot writes
 */

const MS_PER_SECOND = 1000;
const SECONDS_BETWEEN_WRITES = 5;

export const rateLimitsThrottleStatics = {
  minIntervalMs: SECONDS_BETWEEN_WRITES * MS_PER_SECOND,
} as const;
