/**
 * PURPOSE: Filters quest.comments down to the ones anchored to exactly ONE flow-diagram box — a
 * flow node, or (when observableId is given) one of that node's observable cards — and returns
 * them newest-first, so a node click and its observable card's click each show only their own
 * comments and never each other's.
 *
 * USAGE:
 * boxCommentsTransformer({comments: quest.comments, flowId, nodeId});
 * // Returns this node's own comments (excludes any anchored to one of its observables), newest first
 *
 * boxCommentsTransformer({comments: quest.comments, flowId, nodeId, observableId});
 * // Returns only comments anchored to that exact observable card, newest first
 */
import type {
  FlowId,
  FlowNodeId,
  ObservableId,
  QuestComment,
} from '@dungeonmaster/shared/contracts';

export const boxCommentsTransformer = ({
  comments,
  flowId,
  nodeId,
  observableId,
}: {
  comments: readonly QuestComment[];
  flowId: FlowId;
  nodeId: FlowNodeId;
  observableId?: ObservableId;
}): QuestComment[] => {
  const matches = comments.filter((comment) => {
    if (String(comment.flowId) !== String(flowId)) {
      return false;
    }

    if (String(comment.nodeId) !== String(nodeId)) {
      return false;
    }

    if (observableId === undefined) {
      return comment.observableId === undefined;
    }

    if (comment.observableId === undefined) {
      return false;
    }

    return String(comment.observableId) === String(observableId);
  });

  return matches.sort((a, b) => {
    if (a.createdAt === b.createdAt) {
      return 0;
    }

    return a.createdAt > b.createdAt ? -1 : 1;
  });
};
