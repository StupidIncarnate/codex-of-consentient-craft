/**
 * PURPOSE: Maximum retry limits for quest phase resolver agents
 *
 * USAGE:
 * phaseResolverLimitsStatics.maxPathseekerAttempts;
 * // Returns: 3
 */

export const phaseResolverLimitsStatics = {
  maxPathseekerAttempts: 3,
  maxWardFailures: 3,
  maxSiegemasterFailures: 2,
  maxLawbringerFailures: 2,
} as const;
