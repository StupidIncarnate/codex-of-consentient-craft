/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/comments across all three server
 * response shapes (200 success, 409 stale anchors, 4xx/5xx error) in one permissive object, so the
 * broker can safeParse the body once and branch on HTTP status rather than on the body's shape.
 *
 * USAGE:
 * commentBatchReplyContract.safeParse({ chatProcessId: 'proc-1' });
 * // Returns success with the 200 success shape
 * commentBatchReplyContract.safeParse({ staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }] });
 * // Returns success with the 409 denial shape
 */

import { z } from '#gateway/npm/zod';

import { commentAnchorContract } from '../comment-anchor/comment-anchor-contract';

export const commentBatchReplyContract = z
  .object({
    chatProcessId: z.string().min(1).brand<'CommentBatchReplyChatProcessId'>().optional(),
    // The markdown turn the agent actually received, echoed back so the panel can render the user's
    // own entry immediately instead of waiting for a reload to replay it from the session file.
    deliveredMessage: z.string().min(1).brand<'CommentBatchReplyDeliveredMessage'>().optional(),
    staleAnchors: z.array(commentAnchorContract).optional(),
    error: z.string().min(1).brand<'CommentBatchReplyError'>().optional(),
  })
  .brand<'CommentBatchReply'>();

export type CommentBatchReply = z.infer<typeof commentBatchReplyContract>;
