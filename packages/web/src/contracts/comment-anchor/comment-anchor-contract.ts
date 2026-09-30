/**
 * PURPOSE: Defines the polymorphic anchor a queued comment attaches to — a flow node, or an
 * assertion (observable) card branching off that node.
 *
 * USAGE:
 * commentAnchorContract.parse({ flowId: 'login-flow', nodeId: 'login-page' });
 * // Returns: CommentAnchor for a node-card comment (no observableId)
 * commentAnchorContract.parse({ flowId: 'login-flow', nodeId: 'login-page', observableId: 'login-redirects-to-dashboard' });
 * // Returns: CommentAnchor for an assertion-card comment
 */

import { z } from '#gateway/npm/zod';

import { flowNodeContract, flowContract, flowObservableContract } from '@dungeonmaster/shared/contracts';

export const commentAnchorContract = z.object({
  flowId: flowContract.shape.id,
  // Carried even for an observable comment, so the anchor resolves through its parent node.
  nodeId: flowNodeContract.shape.id,
  // Set only when the comment was left on a FLOW_OBSERVABLE_NODE card; absent for a node-card comment.
  observableId: flowObservableContract.shape.id.optional(),
});

export type CommentAnchor = z.infer<typeof commentAnchorContract>;
