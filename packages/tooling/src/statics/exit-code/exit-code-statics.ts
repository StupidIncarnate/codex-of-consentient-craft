/**
 * PURPOSE: Defines the maximum valid exit code value for process execution.
 *
 * USAGE:
 * const maxExitCode = exitCodeStatics.limits.max; // 255
 * // Returns: Object with limits.max set to 255
 */
export const exitCodeStatics = {
  limits: {
    max: 255,
  },
} as const;
