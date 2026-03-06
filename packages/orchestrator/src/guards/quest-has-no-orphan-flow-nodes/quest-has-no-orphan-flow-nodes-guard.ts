/**
 * PURPOSE: Validates that every flow node is connected to at least one edge (as source or target)
 *
 * USAGE:
 * questHasNoOrphanFlowNodesGuard({flows});
 * // Returns true if all nodes are referenced by at least one edge, false otherwise
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questHasNoOrphanFlowNodesGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  if (flows.length === 0) {
    return true;
  }

  return flows.every((flow) => {
    const connectedNodeIds = new Set(
      flow.edges.flatMap((edge) => [String(edge.from), String(edge.to)]),
    );

    return flow.nodes.every((node) => connectedNodeIds.has(String(node.id)));
  });
};
