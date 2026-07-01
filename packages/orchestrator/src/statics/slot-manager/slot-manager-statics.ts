/**
 * PURPOSE: Defines immutable configuration values for slot-based orchestration phases
 *
 * USAGE:
 * slotManagerStatics.codeweaver.slotCount;
 * // Returns 3
 */

export const slotManagerStatics = {
  codeweaver: {
    slotCount: 3,
    maxFollowupDepth: 5,
  },
  flowrider: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
  },
  siegemaster: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
    // Total Siegemaster runs allowed per flow before a `failed` signal BLOCKs instead of recovering.
    // Mirrors ward.maxRetries (used as maxAttempts): attempts 0..maxAttempts-1, recover on the
    // first maxAttempts-1, BLOCK on the last. A siege `failed` splices a spiritmender + ward + a
    // fresh siege retry until this budget is spent.
    maxAttempts: 3,
  },
  lawbringer: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
  },
  ward: {
    maxRetries: 3,
    spiritmenderMaxConcurrent: 3,
    spiritmenderBatchSize: 3,
  },
} as const;
