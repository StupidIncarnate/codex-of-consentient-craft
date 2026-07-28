/**
 * PURPOSE: Checks whether two comment anchors point at the same flow-diagram box — same flowId,
 * nodeId, and observableId (including "both omit observableId" counting as a match). Used to
 * find the queue entry belonging to a given box, so re-queueing an edited comment replaces the
 * existing entry instead of appending a duplicate.
 *
 * USAGE:
 * isSameCommentAnchorGuard({ left: anchorA, right: anchorB });
 * // Returns true when both anchors resolve to the same node, or the same assertion card
 */

import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';

export const isSameCommentAnchorGuard = ({
  left,
  right,
}: {
  left?: CommentAnchor;
  right?: CommentAnchor;
}): boolean => {
  if (left === undefined) return false;
  if (right === undefined) return false;
  if (left.flowId !== right.flowId) return false;
  if (left.nodeId !== right.nodeId) return false;
  return left.observableId === right.observableId;
};
