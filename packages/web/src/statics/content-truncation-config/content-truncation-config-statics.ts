/**
 * PURPOSE: Defines thresholds for truncating content in chat message display
 *
 * USAGE:
 * contentTruncationConfigStatics.charLimit;
 * // Returns 200
 */

export const contentTruncationConfigStatics = {
  charLimit: 200,
  lineLimit: 8,
  longFieldLimit: 120,
  msDivisor: 1000,
} as const;
