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
const nonWhitespaceCommentBatchEntryContract = commentBatchEntryContract
  .refine((entry) => entry.text.trim().length > 0, {
    message: 'Comment text must not be whitespace-only',
  })
  // A delivered batch becomes the `-p` argv of the spawned CLI, and a process argument cannot
  // carry a NUL — child_process.spawn throws on one. Caught here, the batch is a clean 400 with
  // nothing written. Caught any later it is a 500 raised AFTER the comments were already
  // persisted, and since the browser releases its queue only on a 200, the user retries forever
  // while every attempt appends another duplicate row to the quest.
  // Deliberately NUL only: newlines (Shift+Enter), tabs and CRLF all survive an argv intact and
  // are ordinary content in a pasted comment, so a blanket control-character ban would reject the
  // multi-line comments the popover exists to write.
  .refine((entry) => !entry.text.includes('\u0000'), {
    message: 'Comment text must not contain a NUL control character',
  });

export const commentBatchBodyContract = z.object({
  // min(1) is load-bearing: an empty array is a 400, not a no-op
  comments: z.array(nonWhitespaceCommentBatchEntryContract).min(1),
});

export type CommentBatchBody = z.infer<typeof commentBatchBodyContract>;
