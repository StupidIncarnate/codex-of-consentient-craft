/**
 * PURPOSE: Defines the validated body shape for POST /api/quests/:questId/comments — a batch of queued comments
 *
 * USAGE:
 * const { comments } = commentBatchBodyContract.parse(body);
 * // Returns: { comments: CommentBatchEntry[] } — one array entry per queued comment
 */

import { z } from 'zod';

import { commentBatchEntryContract } from '@dungeonmaster/shared/contracts';

export const commentBatchBodyContract = z.object({
  // min(1) is load-bearing: an empty array is a 400, not a no-op
  comments: z.array(commentBatchEntryContract).min(1),
});

export type CommentBatchBody = z.infer<typeof commentBatchBodyContract>;
