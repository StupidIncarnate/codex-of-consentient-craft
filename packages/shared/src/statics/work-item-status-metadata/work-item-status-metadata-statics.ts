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
    queued: {
      // queued = deps satisfied, committed to a role group, but awaiting slot dispatch.
      // isActive=true so pause resets these along with in_progress items, and chat-role
      // dedup treats a queued chat-role the same as an executing one.
      // satisfiesDependency=false because the work hasn't produced output yet.
      isTerminal: false,
      satisfiesDependency: false,
      isActive: true,
      isPending: false,
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
