/**
 * PURPOSE: Deterministic mock values for run ID generation in tests
 *
 * USAGE:
 * jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
 * // Produces deterministic timestamp portion of run ID
 */

export const runIdMockStatics = {
  timestamp: 1739625600000,
  randomValue: 0.6389,
} as const;
