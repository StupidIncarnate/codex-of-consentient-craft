/**
 * PURPOSE: Defines one entry of the 409 comment-batch response's staleAnchors array — a queued comment's
 * anchor that no longer resolves against quest.flows
 *
 * USAGE:
 * commentStaleAnchorContract.parse({flowId: 'login-flow', nodeId: 'start'});
 * // Returns: CommentStaleAnchor — one anchor the browser drops from its queue
 */

import { z } from '#gateway/npm/zod';

import { flowNodeContract, flowContract, flowObservableContract } from '@dungeonmaster/shared/contracts';

export const commentStaleAnchorContract = z.object({
  flowId: flowContract.shape.id,
  nodeId: flowNodeContract.shape.id,
  observableId: flowObservableContract.shape.id.optional(),
});

export type CommentStaleAnchor = z.infer<typeof commentStaleAnchorContract>;
