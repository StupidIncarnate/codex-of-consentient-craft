/**
 * PURPOSE: Constants for rate-limit windows (5h / 7d Anthropic account quotas)
 *
 * USAGE:
 * rateLimitStatics.percent.max
 * // Returns: 100 — used as the upper bound for usedPercentage validation
 */

export const rateLimitStatics = {
  percent: {
    min: 0,
    max: 100,
  },
} as const;
