/**
 * PURPOSE: Defines the `data` QuestCommentBatchResponder returns on success
 *
 * USAGE:
 * const data = questCommentBatchResponseDataContract.parse(value);
 * // Returns validated QuestCommentBatchResponseData
 */

import { z } from '#gateway/npm/zod';
import { commentStaleAnchorContract } from '../comment-stale-anchor/comment-stale-anchor-contract';
import { commentBatchResponseContract } from '../comment-batch-response/comment-batch-response-contract';

export const questCommentBatchResponseDataContract = z.union([z.strictObject({ error: z.string(), staleAnchors: z.array(commentStaleAnchorContract) }).brand<'QuestCommentBatchResponseData1'>(), commentBatchResponseContract]);

export type QuestCommentBatchResponseData = z.infer<typeof questCommentBatchResponseDataContract>;
