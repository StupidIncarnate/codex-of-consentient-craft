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
    timeoutMs: 600000,
    maxFollowupDepth: 5,
  },
  siegemaster: {
    concurrentLimit: 3,
    timeoutMs: 300000,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
  },
  lawbringer: {
    concurrentLimit: 3,
    timeoutMs: 300000,
    maxRetries: 2,
    maxDispatchDepth: 3,
    maxFollowupDepth: 3,
  },
  ward: {
    maxRetries: 3,
    spiritmenderTimeoutMs: 600000,
    spiritmenderMaxConcurrent: 3,
    spiritmenderBatchSize: 3,
  },
  pathseeker: {
    timeoutMs: 600000,
  },
} as const;
