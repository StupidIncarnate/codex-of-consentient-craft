/**
 * PURPOSE: Given a child-edge map (each sub-agent's realAgentId -> the realAgentIds of the
 * sub-agents it spawned) and a root sub-agent's realAgentId, returns the set of the root plus
 * every transitive descendant. Scopes per-work-item chat replay to a sub-agent AND the nested
 * sub-agents it spawned, instead of just the single exact-match file.
 *
 * USAGE:
 * subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId });
 * // Returns Set<AgentId> = { rootAgentId, ...all transitive children }. Cycle-safe: a node
 * // already in the set is never re-expanded, so a self- or back-edge terminates the walk.
 */

import type { AgentId } from '../../contracts/agent-id/agent-id-contract';

export const subagentDescendantAgentIdsTransformer = ({
  childEdges,
  rootAgentId,
}: {
  childEdges: Map<AgentId, AgentId[]>;
  rootAgentId: AgentId;
}): Set<AgentId> => {
  const descendants = new Set<AgentId>([rootAgentId]);
  let frontier: AgentId[] = [rootAgentId];
  while (frontier.length > 0) {
    const nextFrontier: AgentId[] = [];
    for (const agentId of frontier) {
      for (const child of childEdges.get(agentId) ?? []) {
        if (!descendants.has(child)) {
          descendants.add(child);
          nextFrontier.push(child);
        }
      }
    }
    frontier = nextFrontier;
  }
  return descendants;
};
