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
  siegemaster: {
    concurrentLimit: 3,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
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
