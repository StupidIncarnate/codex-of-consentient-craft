/**
 * PURPOSE: Defines the threshold for flagging slow files in ward output
 *
 * USAGE:
 * slowFileThresholdStatics.threshold.warnMs;
 * // Returns: 5000 (5 seconds)
 */
export const slowFileThresholdStatics = {
  threshold: {
    warnMs: 5000,
  },
} as const;
