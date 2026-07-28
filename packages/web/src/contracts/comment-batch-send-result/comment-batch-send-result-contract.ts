/**
 * PURPOSE: Defines the three outcomes questCommentBatchBroker can return after POSTing a queued
 * comment batch — sent (clears the whole local queue), stale (prunes exactly the named anchors and
 * notifies), or failed (retains the entire queue and notifies) — so the queue bar widget branches on
 * outcome instead of on raw HTTP status.
 *
 * USAGE:
 * commentBatchSendResultContract.parse({ outcome: 'sent', chatProcessId: 'proc-1' });
 * // Returns CommentBatchSendResult telling the widget to clear its local queue
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

import { commentAnchorContract } from '../comment-anchor/comment-anchor-contract';

export const commentBatchSendResultContract = z.discriminatedUnion('outcome', [
  z.object({ outcome: z.literal('sent'), chatProcessId: processIdContract }),
  z.object({ outcome: z.literal('stale'), staleAnchors: z.array(commentAnchorContract).min(1) }),
  z.object({
    outcome: z.literal('failed'),
    error: z.string().min(1).brand<'CommentBatchErrorMessage'>(),
  }),
]);

export type CommentBatchSendResult = z.infer<typeof commentBatchSendResultContract>;
