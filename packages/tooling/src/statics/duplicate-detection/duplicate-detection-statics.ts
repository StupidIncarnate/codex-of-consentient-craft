/**
 * PURPOSE: Defines default configuration values for duplicate detection thresholds and string length.
 *
 * USAGE:
 * const threshold = duplicateDetectionStatics.defaults.threshold; // 3
 * const minLength = duplicateDetectionStatics.defaults.minLength; // 3
 * // Returns: Object with defaults for threshold (3) and minLength (3)
 */
export const duplicateDetectionStatics = {
  defaults: {
    threshold: 3,
    minLength: 3,
  },
} as const;
