/**
 * PURPOSE: Defines the threshold for switching from raw number to abbreviated "k" format in token displays
 *
 * USAGE:
 * tokenFormatConfigStatics.abbreviationThreshold;
 * // Returns 1000
 */

export const tokenFormatConfigStatics = {
  abbreviationThreshold: 1000,
  abbreviationDivisor: 1000,
  charsPerTokenEstimate: 3.7,
} as const;
