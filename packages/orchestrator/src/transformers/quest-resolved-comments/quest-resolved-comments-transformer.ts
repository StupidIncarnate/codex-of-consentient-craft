/**
 * PURPOSE: Drops comments whose flow, node, or observable anchor no longer exists in the quest's
 * post-upsert flows — the server-side half of orphan comment cleanup on quest write.
 *
 * USAGE:
 * questResolvedCommentsTransformer({comments: quest.comments, flows: quest.flows});
 * // Returns QuestComment[] — only the comments whose anchor still resolves, original order kept
 *
 * This cleanup is BEST EFFORT: a stray orphaned comment that survives a write is tolerated and
 * harmless, and must NEVER be promoted to a save-time validation gate — it must never fail a
 * save, block a status transition, or appear as a failedCheck. A quest carrying a dangling
 * comment is cosmetically imperfect and functionally harmless, whereas an invariant that rejects
 * one would wedge a quest on a record the user owns and no agent is allowed to delete.
 */
import type {
  Flow,
  FlowId,
  FlowNodeId,
  ObservableId,
  QuestComment,
} from '@dungeonmaster/shared/contracts';

export const questResolvedCommentsTransformer = ({
  comments,
  flows,
}: {
  comments: QuestComment[];
  flows: Flow[];
}): QuestComment[] => {
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

  return comments.filter((comment) => {
    // Best effort: a comment whose anchor fails to resolve here is simply omitted from the
    // returned list — it is never surfaced as an error. See file header: this must never grow
    // into a save-time validation gate that fails a save, blocks a status transition, or
    // appears as a failedCheck.
    const nodeObservables = flowNodeObservables.get(comment.flowId);
    if (!nodeObservables) {
      return false;
    }

    const observableIds = nodeObservables.get(comment.nodeId);
    if (!observableIds) {
      return false;
    }

    if (comment.observableId === undefined) {
      return true;
    }

    return observableIds.has(comment.observableId);
  });
};
