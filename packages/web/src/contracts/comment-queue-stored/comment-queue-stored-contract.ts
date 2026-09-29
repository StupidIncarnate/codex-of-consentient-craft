/**
 * PURPOSE: Validates the raw localStorage array a quest's comment queue is stored as, keeping every
 * entry that still validates and turning each one that does not into `null`. Reach for
 * commentQueueEntryContract when a single entry is parsed; this one is for the whole stored array,
 * where one hand-edited or stale entry must not take the rest of the queue down with it.
 *
 * USAGE:
 * commentQueueStoredContract.parse(JSON.parse(raw));
 * // Returns (CommentQueueEntry | null)[] — null marks an entry that failed validation
 */

import { z } from '#gateway/npm/zod';

import { commentQueueEntryContract } from '../comment-queue-entry/comment-queue-entry-contract';

export const commentQueueStoredContract = z.array(commentQueueEntryContract.nullable().catch(null));

export type CommentQueueStored = z.infer<typeof commentQueueStoredContract>;
