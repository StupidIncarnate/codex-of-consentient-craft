/**
 * PURPOSE: Defines the validated body shape for POST /api/quests/:questId/comments — a batch of queued comments
 *
 * USAGE:
 * const { comments } = commentBatchBodyContract.parse(body);
 * // Returns: { comments: CommentBatchEntry[] } — one array entry per queued comment
 */

import { z } from 'zod';

import { commentBatchEntryContract } from '@dungeonmaster/shared/contracts';

// The browser's own compose editor already refuses to queue whitespace-only text (Enter on blank
// text leaves the editor open and writes nothing), but that guard lives in the popover widget, not
// in commentTextContract, which only checks non-empty length. A non-browser client (a raw HTTP
// call, a replay, a future caller) can reach this route directly, so the entry is re-validated here
// — the one sink every caller of this route is forced through. Refining the ENTRY (not the array)
// keeps a failure's issue path at ['comments', index, ...] rather than ['comments'], so the
// responder's array-level-vs-entry-level classification still reports the entry-level message.
const nonWhitespaceCommentBatchEntryContract = commentBatchEntryContract.refine(
  (entry) => entry.text.trim().length > 0,
  { message: 'Comment text must not be whitespace-only' },
);

export const commentBatchBodyContract = z.object({
  // min(1) is load-bearing: an empty array is a 400, not a no-op
  comments: z.array(nonWhitespaceCommentBatchEntryContract).min(1),
});

export type CommentBatchBody = z.infer<typeof commentBatchBodyContract>;
