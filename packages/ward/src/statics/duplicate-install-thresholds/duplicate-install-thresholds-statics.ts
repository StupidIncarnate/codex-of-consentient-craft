/**
 * PURPOSE: The minimum number of distinct top-level `node_modules` locations a name must resolve at
 * before `duplicateInstallCheckBroker` reports it, and `duplicateInstallViolationContract` requires
 * of its own `locations` array — one shared value so a broker change and the contract's own
 * invariant can never drift apart.
 *
 * USAGE:
 * duplicateInstallThresholdsStatics.counts.minimumLocationsForViolation;
 * // Returns 2
 */

export const duplicateInstallThresholdsStatics = {
  counts: {
    minimumLocationsForViolation: 2,
  },
} as const;
