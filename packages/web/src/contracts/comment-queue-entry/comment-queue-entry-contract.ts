/**
 * PURPOSE: Defines one comment queued in localStorage before it is sent as part of a batch — a
 * CommentAnchor plus the text and the moment that text was last edited.
 *
 * USAGE:
 * commentQueueEntryContract.parse({ flowId: 'login-flow', nodeId: 'login-page', text: 'This assertion looks wrong', createdAt: '2026-07-01T12:00:00.000Z' });
 * // Returns: CommentQueueEntry — one element of the per-quest localStorage array
 */

import { z } from 'zod';

import { commentTextContract } from '@dungeonmaster/shared/contracts';

import { commentAnchorContract } from '../comment-anchor/comment-anchor-contract';

export const commentQueueEntryContract = commentAnchorContract.extend({
  text: commentTextContract,
  // The age of the text as it currently stands, not of the first draft — re-queueing an edited
  // comment resets this to the edit time, which drives both the 7-day expiry sweep and
  // newest-first ordering after send.
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type CommentQueueEntry = z.infer<typeof commentQueueEntryContract>;
