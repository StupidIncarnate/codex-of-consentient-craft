/**
 * PURPOSE: Defines immutable configuration for the PathSeeker verification pipeline
 *
 * USAGE:
 * pathseekerPipelineStatics.limits.maxAttempts;
 * // Returns the maximum number of PathSeeker re-spawn attempts
 */

export const pathseekerPipelineStatics = {
  limits: {
    maxAttempts: 3,
  },
} as const;
