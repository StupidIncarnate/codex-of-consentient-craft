/**
 * PURPOSE: Defines line and character limits per display mode for ward output
 *
 * USAGE:
 * const maxLines = outputLimitsStatics.summary.maxLines;
 * // Returns: 20
 */
export const outputLimitsStatics = {
  summary: {
    maxLines: 20,
    maxChars: 2000,
  },
  verbose: {
    maxLines: 200,
    maxChars: 20000,
  },
  stackTraceDefaultMaxLines: 5,
} as const;
