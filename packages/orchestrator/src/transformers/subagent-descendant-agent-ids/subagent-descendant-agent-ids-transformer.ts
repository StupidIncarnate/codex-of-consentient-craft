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

import type { Agent } from '@dungeonmaster/shared/contracts';

export const subagentDescendantAgentIdsTransformer = ({
  childEdges,
  rootAgentId,
}: {
  childEdges: Map<Agent['id'], Agent['id'][]>;
  rootAgentId: Agent['id'];
}): Set<Agent['id']> => {
  const descendants = new Set<Agent['id']>([rootAgentId]);
  let frontier: Agent['id'][] = [rootAgentId];
  while (frontier.length > 0) {
    const nextFrontier: Agent['id'][] = [];
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
