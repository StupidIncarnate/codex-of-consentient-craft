/**
 * PURPOSE: Defines the data `CommentBatchFlow` returns
 *
 * USAGE:
 * commentBatchResultContract.parse(value);
 * // Returns validated CommentBatchResult
 */
import { z } from '#gateway/npm/zod';

export const commentBatchResultContract = z
  .object({
    chatProcessId: z.string().brand<'CommentBatchResultChatProcessId'>(),
    message: z.string().brand<'CommentBatchResultMessage'>(),
  })
  .brand<'CommentBatchResult'>();

export type CommentBatchResult = z.infer<typeof commentBatchResultContract>;
