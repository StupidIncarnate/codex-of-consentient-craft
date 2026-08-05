/**
 * PURPOSE: Defines the 200 response body for POST /api/quests/:questId/comments
 *
 * USAGE:
 * commentBatchResponseContract.parse({chatProcessId: 'proc-12345', deliveredMessage: 'Flow "X"...'});
 * // Returns: CommentBatchResponse — the chatProcessId the batch was delivered to, plus the exact
 * // markdown turn the agent received. Claude's --resume stream never echoes the prompt back, so
 * // without this the browser has nothing to render for the user's own message until a reload
 * // replays the session from disk.
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const commentBatchResponseContract = z.object({
  chatProcessId: processIdContract,
  deliveredMessage: z.string().min(1).brand<'DeliveredCommentMessage'>(),
});

export type CommentBatchResponse = z.infer<typeof commentBatchResponseContract>;
