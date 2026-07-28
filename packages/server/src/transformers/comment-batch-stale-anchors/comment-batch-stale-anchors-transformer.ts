/**
 * PURPOSE: Identifies every posted comment-batch entry whose flow/node/observable anchor no
 * longer resolves against the quest's current flows — the offenders a 409 response NAMES so the
 * browser can prune exactly those queue entries instead of dead-ending on a bare status code.
 *
 * USAGE:
 * commentBatchStaleAnchorsTransformer({comments: batch, flows: quest.flows});
 * // Returns CommentStaleAnchor[] — only entries that FAIL to resolve, in `comments` order.
 * // Entries whose anchor still resolves are omitted entirely; an all-resolving batch => [].
 */
import type {
  CommentBatchEntry,
  Flow,
  FlowId,
  FlowNodeId,
  ObservableId,
} from '@dungeonmaster/shared/contracts';

import { commentStaleAnchorContract } from '../../contracts/comment-stale-anchor/comment-stale-anchor-contract';
import type { CommentStaleAnchor } from '../../contracts/comment-stale-anchor/comment-stale-anchor-contract';

export const commentBatchStaleAnchorsTransformer = ({
  comments,
  flows,
}: {
  comments: CommentBatchEntry[];
  flows: Flow[];
}): CommentStaleAnchor[] => {
  const flowNodeObservables = new Map<FlowId, Map<FlowNodeId, Set<ObservableId>>>();

  for (const flow of flows) {
    const nodeObservables = new Map<FlowNodeId, Set<ObservableId>>();
    for (const node of flow.nodes) {
      const observableIds = new Set<ObservableId>();
      for (const observable of node.observables) {
        observableIds.add(observable.id);
      }
      nodeObservables.set(node.id, observableIds);
    }
    flowNodeObservables.set(flow.id, nodeObservables);
  }

  const staleComments = comments.filter((comment) => {
    const nodeObservables = flowNodeObservables.get(comment.flowId);
    const observableIds = nodeObservables?.get(comment.nodeId);
    if (observableIds === undefined) {
      return true;
    }
    if (comment.observableId === undefined) {
      return false;
    }
    return !observableIds.has(comment.observableId);
  });

  return staleComments.map((comment) =>
    comment.observableId === undefined
      ? commentStaleAnchorContract.parse({ flowId: comment.flowId, nodeId: comment.nodeId })
      : commentStaleAnchorContract.parse({
          flowId: comment.flowId,
          nodeId: comment.nodeId,
          observableId: comment.observableId,
        }),
  );
};
