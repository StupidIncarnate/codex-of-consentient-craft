/**
 * PURPOSE: Returns descriptions of non-terminal flow nodes that have no outgoing edges
 *
 * USAGE:
 * questDeadEndFlowNodesTransformer({flows});
 * // Returns ErrorMessage[] — e.g. ["flow 'login' node 'stuck' (type state) has no outgoing edge"].
 */
import type { Flow } from '@dungeonmaster/shared/contracts';

export const questDeadEndFlowNodesTransformer = ({ flows }: { flows?: Flow[] }): string[] => {
  if (!flows) {
    return [];
  }

  const offenders: string[] = [];

  for (const flow of flows) {
    const nodesWithOutgoing = new Set<unknown>();
    for (const edge of flow.edges) {
      nodesWithOutgoing.add(String(edge.from));
    }

    for (const node of flow.nodes) {
      if (node.type === 'terminal') {
        continue;
      }
      if (!nodesWithOutgoing.has(String(node.id))) {
        offenders.push(
          `flow '${String(flow.id)}' node '${String(node.id)}' (type ${node.type}) has no outgoing edge`,
        );
      }
    }
  }

  return offenders;
};
