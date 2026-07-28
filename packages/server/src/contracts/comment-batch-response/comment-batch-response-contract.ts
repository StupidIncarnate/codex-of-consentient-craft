/**
 * PURPOSE: Defines the 200 response body for POST /api/quests/:questId/comments
 *
 * USAGE:
 * commentBatchResponseContract.parse({chatProcessId: 'proc-12345'});
 * // Returns: CommentBatchResponse — carries the chatProcessId the batch was delivered to
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const commentBatchResponseContract = z.object({
  chatProcessId: processIdContract,
});

export type CommentBatchResponse = z.infer<typeof commentBatchResponseContract>;
