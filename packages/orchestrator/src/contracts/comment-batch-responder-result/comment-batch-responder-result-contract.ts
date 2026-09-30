/**
 * PURPOSE: Defines the data `CommentBatchResponder` returns
 *
 * USAGE:
 * commentBatchResponderResultContract.parse(value);
 * // Returns validated CommentBatchResponderResult
 */
import { z } from '#gateway/npm/zod';
import { questCommentContract, flowContract } from '@dungeonmaster/shared/contracts';

export const commentBatchResponderResultContract = z
  .object({ comments: z.array(questCommentContract), flows: z.array(flowContract) })
  .brand<'CommentBatchResponderResult'>();

export type CommentBatchResponderResult = z.infer<typeof commentBatchResponderResultContract>;
