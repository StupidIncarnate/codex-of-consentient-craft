/**
 * PURPOSE: Filters a queued-comment array down to entries still inside the 7-day expiry window,
 * so a purge at quest-route mount drops stale entries while newly-edited or freshly-queued ones
 * survive. Pure — takes the current time as an explicit input rather than reading Date.now()
 * itself, so callers control the purge instant.
 *
 * USAGE:
 * commentQueueSweepTransformer({ entries, nowMs: Date.now() });
 * // Returns a NEW array containing only entries whose createdAt is within 7 days of nowMs
 */

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

export const commentQueueSweepTransformer = ({
  entries,
  nowMs,
}: {
  entries: readonly CommentQueueEntry[];
  nowMs: number;
}): CommentQueueEntry[] => {
  const windowMs = commentQueueStatics.expiry.days * commentQueueStatics.expiry.msPerDay;

  return entries.filter((entry) => nowMs - Date.parse(String(entry.createdAt)) <= windowMs);
};
