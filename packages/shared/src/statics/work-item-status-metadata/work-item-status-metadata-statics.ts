/**
 * PURPOSE: Per-work-item-status metadata record — source of truth for every work-item-status flag
 *
 * USAGE:
 * workItemStatusMetadataStatics.statuses.complete;
 * // Returns { isTerminal: true, satisfiesDependency: true, isComplete: true, ... }
 */

export const workItemStatusMetadataStatics = {
  statuses: {
    pending: {
      isTerminal: false,
      satisfiesDependency: false,
      isActive: false,
      isPending: true,
      isComplete: false,
      isSkipped: false,
      isFailure: false,
    },
    in_progress: {
      isTerminal: false,
      satisfiesDependency: false,
      isActive: true,
      isPending: false,
      isComplete: false,
      isSkipped: false,
      isFailure: false,
    },
    complete: {
      isTerminal: true,
      satisfiesDependency: true,
      isActive: false,
      isPending: false,
      isComplete: true,
      isSkipped: false,
      isFailure: false,
    },
    failed: {
      isTerminal: true,
      satisfiesDependency: true,
      isActive: false,
      isPending: false,
      isComplete: false,
      isSkipped: false,
      isFailure: true,
    },
    skipped: {
      isTerminal: true,
      satisfiesDependency: false,
      isActive: false,
      isPending: false,
      isComplete: false,
      isSkipped: true,
      isFailure: false,
    },
  },
} as const;
