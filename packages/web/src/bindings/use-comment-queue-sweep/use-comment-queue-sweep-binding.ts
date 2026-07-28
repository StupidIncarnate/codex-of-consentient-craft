/**
 * PURPOSE: React hook that purges expired queued comments once, on quest-route mount. It scans
 * every per-quest comment-queue key in localStorage — not just the mounted quest's — so abandoned
 * reviews on quests the user never reopens cannot accumulate forever.
 *
 * USAGE:
 * useCommentQueueSweepBinding();
 * // Drops entries older than the 7 day window and removes any key the purge empties
 */

import { useEffect } from 'react';

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { commentQueueState } from '../../state/comment-queue/comment-queue-state';

export const useCommentQueueSweepBinding = (): AdapterResult => {
  useEffect(() => {
    // Empty dep list: the sweep is a mount-time purge, not a per-render concern. `Date.now()` is
    // read here rather than inside the store so the store stays deterministic and testable.
    commentQueueState.sweepExpired({ nowMs: Date.now() });
  }, []);

  return { success: true as const };
};
