/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/comments across all three server
 * response shapes (200 success, 409 stale anchors, 4xx/5xx error) in one permissive object, so the
 * broker can safeParse the body once and branch on HTTP status rather than on the body's shape.
 *
 * USAGE:
 * commentBatchResponseContract.safeParse({ chatProcessId: 'proc-1' });
 * // Returns success with the 200 success shape
 * commentBatchResponseContract.safeParse({ staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }] });
 * // Returns success with the 409 denial shape
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

import { commentAnchorContract } from '../comment-anchor/comment-anchor-contract';

export const commentBatchResponseContract = z.object({
  chatProcessId: processIdContract.optional(),
  staleAnchors: z.array(commentAnchorContract).optional(),
  error: z.string().min(1).brand<'CommentBatchErrorMessage'>().optional(),
});

export type CommentBatchResponse = z.infer<typeof commentBatchResponseContract>;
